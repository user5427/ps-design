import type { DataSource, Repository } from "typeorm";
import { NotFoundError, BadRequestError } from "@/shared/errors";
import type { Appointment } from "@/modules/appointments/appointment/appointment.entity";
import {
  AppointmentPayment,
  type PaymentMethod,
} from "./appointment-payment.entity";
import { PaymentLineItem, type LineItemType } from "./payment-line-item.entity";

export interface ICreatePaymentLineItem {
  type: LineItemType;
  label: string;
  amount: number;
}

export interface ICreatePayment {
  appointmentId: string;
  businessId: string;
  paidById: string;
  paymentMethod: PaymentMethod;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  employeeName: string;
  employeeId: string;
  tipAmount?: number;
  lineItems: ICreatePaymentLineItem[];
  externalPaymentId?: string;
}

export interface IRefundPayment {
  refundedById: string;
  reason?: string;
}

export class AppointmentPaymentRepository {
  constructor(
    private dataSource: DataSource,
    private repository: Repository<AppointmentPayment>,
    private lineItemRepository: Repository<PaymentLineItem>,
    private appointmentRepository: Repository<Appointment>,
  ) { }

  async findByAppointmentId(
    appointmentId: string,
  ): Promise<AppointmentPayment | null> {
    return this.repository.findOne({
      where: { appointmentId },
      relations: ["lineItems", "paidBy", "refundedBy"],
    });
  }

  async findByAppointmentIdAndBusinessId(
    appointmentId: string,
    businessId: string,
  ): Promise<AppointmentPayment | null> {
    return this.repository.findOne({
      where: { appointmentId, businessId },
      relations: ["lineItems", "paidBy", "refundedBy"],
    });
  }

  async create(data: ICreatePayment): Promise<AppointmentPayment> {
    const totalAmount =
      data.servicePrice +
      (data.tipAmount ?? 0) +
      data.lineItems
        .filter((item) => item.type !== "SERVICE" && item.type !== "TIP")
        .reduce((sum, item) => sum + item.amount, 0);

    return await this.dataSource.transaction(async (manager) => {
      const payment = manager.create(AppointmentPayment, {
        appointmentId: data.appointmentId,
        businessId: data.businessId,
        paidById: data.paidById,
        paymentMethod: data.paymentMethod,
        serviceName: data.serviceName,
        servicePrice: data.servicePrice,
        serviceDuration: data.serviceDuration,
        employeeName: data.employeeName,
        employeeId: data.employeeId,
        tipAmount: data.tipAmount ?? 0,
        totalAmount,
        paidAt: new Date(),
        externalPaymentId: data.externalPaymentId ?? null,
      });

      const savedPayment = await manager.save(payment);

      const lineItems = data.lineItems.map((item) =>
        manager.create(PaymentLineItem, {
          paymentId: savedPayment.id,
          type: item.type,
          label: item.label,
          amount: item.amount,
        }),
      );

      await manager.save(lineItems);

      await manager.update(
        this.appointmentRepository.target,
        data.appointmentId,
        {
          status: "PAID",
        },
      );

      return manager.findOne(AppointmentPayment, {
        where: { id: savedPayment.id },
        relations: ["lineItems", "paidBy", "refundedBy"],
      }) as Promise<AppointmentPayment>;
    });
  }

  async refund(
    appointmentId: string,
    businessId: string,
    data: IRefundPayment,
  ): Promise<AppointmentPayment> {
    const payment = await this.findByAppointmentIdAndBusinessId(
      appointmentId,
      businessId,
    );

    if (!payment) {
      throw new NotFoundError("Payment not found for this appointment");
    }

    if (payment.refundedAt) {
      throw new BadRequestError("Payment has already been refunded");
    }

    return await this.dataSource.transaction(async (manager) => {
      await manager.update(AppointmentPayment, payment.id, {
        refundedAt: new Date(),
        refundedById: data.refundedById,
        refundReason: data.reason ?? null,
      });

      await manager.update(this.appointmentRepository.target, appointmentId, {
        status: "REFUNDED",
      });

      return manager.findOne(AppointmentPayment, {
        where: { id: payment.id },
        relations: ["lineItems", "paidBy", "refundedBy"],
      }) as Promise<AppointmentPayment>;
    });
  }
}
