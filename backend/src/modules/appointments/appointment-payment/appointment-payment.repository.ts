import type { DataSource, Repository } from "typeorm";
import { NotFoundError, BadRequestError } from "@/shared/errors";
import type { Appointment } from "@/modules/appointments/appointment/appointment.entity";
import type { PaymentMethod } from "@/modules/payment/payment.entity";
import { Payment } from "@/modules/payment/payment.entity";
import {
  PaymentLineItem,
  type LineItemType,
} from "@/modules/payment/payment-line-item.entity";
import { AppointmentPayment } from "./appointment-payment.entity";

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
    private paymentRepository: Repository<Payment>,
    private lineItemRepository: Repository<PaymentLineItem>,
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async findByAppointmentId(
    appointmentId: string,
  ): Promise<AppointmentPayment | null> {
    return this.repository.findOne({
      where: { appointmentId },
      relations: [
        "payment",
        "payment.lineItems",
        "payment.paidBy",
        "payment.refundedBy",
      ],
    });
  }

  async findByAppointmentIdAndBusinessId(
    appointmentId: string,
    businessId: string,
  ): Promise<AppointmentPayment | null> {
    const aptPayment = await this.repository.findOne({
      where: { appointmentId },
      relations: [
        "payment",
        "payment.lineItems",
        "payment.paidBy",
        "payment.refundedBy",
      ],
    });

    if (aptPayment && aptPayment.payment.businessId === businessId) {
      return aptPayment;
    }
    return null;
  }

  async create(data: ICreatePayment): Promise<AppointmentPayment> {
    const totalAmount =
      data.servicePrice +
      (data.tipAmount ?? 0) +
      data.lineItems
        .filter((item) => item.type !== "SERVICE" && item.type !== "TIP")
        .reduce((sum, item) => sum + item.amount, 0);

    return await this.dataSource.transaction(async (manager) => {
      const payment = manager.create(Payment, {
        businessId: data.businessId,
        paidById: data.paidById,
        method: data.paymentMethod,
        amount: data.servicePrice,
        tipAmount: data.tipAmount ?? 0,
        totalAmount,
        paidAt: new Date(),
        externalPaymentId: data.externalPaymentId ?? null,
      });

      const savedPayment = await manager.save(payment);

      const serviceLineItem = manager.create(PaymentLineItem, {
        paymentId: savedPayment.id,
        type: "SERVICE",
        label: data.serviceName,
        amount: data.servicePrice,
      });

      const otherLineItems = data.lineItems.map((item) =>
        manager.create(PaymentLineItem, {
          paymentId: savedPayment.id,
          type: item.type,
          label: item.label,
          amount: item.amount,
        }),
      );

      await manager.save([serviceLineItem, ...otherLineItems]);

      const appointmentPayment = manager.create(AppointmentPayment, {
        appointmentId: data.appointmentId,
        paymentId: savedPayment.id,
      });

      await manager.save(appointmentPayment);

      await manager.update(
        this.appointmentRepository.target,
        data.appointmentId,
        {
          status: "PAID",
        },
      );

      return this.findByAppointmentId(
        data.appointmentId,
      ) as Promise<AppointmentPayment>;
    });
  }

  async refund(
    appointmentId: string,
    businessId: string,
    data: IRefundPayment,
  ): Promise<AppointmentPayment> {
    const aptPayment = await this.findByAppointmentIdAndBusinessId(
      appointmentId,
      businessId,
    );

    if (!aptPayment) {
      throw new NotFoundError("Payment not found for this appointment");
    }

    if (aptPayment.payment.status === "REFUNDED") {
      throw new BadRequestError("Payment has already been refunded");
    }

    return await this.dataSource.transaction(async (manager) => {
      await manager.update(Payment, aptPayment.paymentId, {
        status: "REFUNDED",
        refundedAt: new Date(),
        refundedById: data.refundedById,
        refundReason: data.reason ?? null,
      });

      await manager.update(this.appointmentRepository.target, appointmentId, {
        status: "REFUNDED",
      });

      return this.findByAppointmentId(
        appointmentId,
      ) as Promise<AppointmentPayment>;
    });
  }
}
