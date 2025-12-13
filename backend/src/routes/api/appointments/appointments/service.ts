import type { FastifyInstance } from "fastify";
import type {
  CreateAppointmentBody,
  UpdateAppointmentBody,
  AppointmentResponse,
  AppointmentStatus,
} from "@ps-design/schemas/appointments/appointment";
import type { Appointment } from "@/modules/appointments/appointment/appointment.entity";
import type { ICreatePaymentLineItem } from "@/modules/appointments/appointment-payment";

function toAppointmentResponse(appointment: Appointment): AppointmentResponse {
  return {
    id: appointment.id,
    customerName: appointment.customerName,
    customerPhone: appointment.customerPhone,
    customerEmail: appointment.customerEmail,
    startTime: appointment.startTime.toISOString(),
    status: appointment.status as AppointmentStatus,
    notes: appointment.notes,
    service: {
      id: appointment.service.id,
      employee: {
        id: appointment.service.employee.id,
        name: appointment.service.employee.name,
        email: appointment.service.employee.email,
      },
      serviceDefinition: {
        id: appointment.service.serviceDefinition.id,
        name: appointment.service.serviceDefinition.name,
        description: appointment.service.serviceDefinition.description,
        duration: appointment.service.serviceDefinition.baseDuration,
        price: appointment.service.serviceDefinition.price,
        category: appointment.service.serviceDefinition.category
          ? {
              id: appointment.service.serviceDefinition.category.id,
              name: appointment.service.serviceDefinition.category.name,
            }
          : null,
      },
    },
    payment: appointment.payment
      ? {
          id: appointment.payment.id,
          servicePrice: appointment.payment.servicePrice,
          serviceDuration: appointment.payment.serviceDuration,
          paymentMethod: appointment.payment.paymentMethod,
          tipAmount: appointment.payment.tipAmount,
          totalAmount: appointment.payment.totalAmount,
          paidAt: appointment.payment.paidAt.toISOString(),
          refundedAt: appointment.payment.refundedAt?.toISOString() || null,
          refundReason: appointment.payment.refundReason,
          lineItems: appointment.payment.lineItems.map((item) => ({
            id: item.id,
            type: item.type,
            label: item.label,
            amount: item.amount,
          })),
        }
      : undefined,
    createdById: appointment.createdById,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}

export async function getAllAppointments(
  fastify: FastifyInstance,
  businessId: string,
): Promise<AppointmentResponse[]> {
  const appointments =
    await fastify.db.appointment.findAllByBusinessId(businessId);
  return appointments.map(toAppointmentResponse);
}

export async function createAppointment(
  fastify: FastifyInstance,
  businessId: string,
  createdById: string,
  input: CreateAppointmentBody,
): Promise<void> {
  await fastify.db.appointment.create({
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    startTime: new Date(input.startTime),
    notes: input.notes,
    serviceId: input.serviceId,
    businessId,
    createdById,
  });
}

export async function getAppointmentById(
  fastify: FastifyInstance,
  businessId: string,
  appointmentId: string,
): Promise<AppointmentResponse> {
  const appointment = await fastify.db.appointment.getById(
    appointmentId,
    businessId,
  );
  return toAppointmentResponse(appointment);
}

export async function updateAppointment(
  fastify: FastifyInstance,
  businessId: string,
  appointmentId: string,
  input: UpdateAppointmentBody,
): Promise<void> {
  await fastify.db.appointment.update(appointmentId, businessId, {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    notes: input.notes,
  });
}

export async function updateAppointmentStatus(
  fastify: FastifyInstance,
  businessId: string,
  appointmentId: string,
  status: AppointmentStatus,
): Promise<AppointmentResponse> {
  const updated = await fastify.db.appointment.updateStatus(
    appointmentId,
    businessId,
    status as import("@/modules/appointments/appointment/appointment.entity").AppointmentStatus,
  );
  return toAppointmentResponse(updated);
}

export async function payAppointment(
  fastify: FastifyInstance,
  businessId: string,
  appointmentId: string,
  paidById: string,
  input: { paymentMethod: string; tipAmount?: number; giftCardCode?: string },
): Promise<void> {
  const appointment = await fastify.db.appointment.getById(
    appointmentId,
    businessId,
  );

  if (appointment.status !== "RESERVED") {
    throw new Error("Only reserved appointments can be paid");
  }

  const service = appointment.service;
  const serviceDefinition = service.serviceDefinition;
  const employee = service.employee;

  const lineItems: ICreatePaymentLineItem[] = [
    {
      type: "SERVICE",
      label: serviceDefinition.name,
      amount: serviceDefinition.price,
    },
  ];

  if (input.tipAmount && input.tipAmount > 0) {
    lineItems.push({
      type: "TIP",
      label: "Tip",
      amount: input.tipAmount,
    });
  }

  // Handle gift card if provided
  let giftCardDiscount = 0;
  if (input.giftCardCode) {
    const giftCard = await fastify.db.giftCard.validateAndRedeem(
      input.giftCardCode,
      businessId,
    );
    // Discount is the minimum of card value and service price
    giftCardDiscount = Math.min(giftCard.value, serviceDefinition.price);
    lineItems.push({
      type: "DISCOUNT",
      label: `Gift Card (${input.giftCardCode})`,
      amount: -giftCardDiscount,
    });
  }

  await fastify.db.appointmentPayment.create({
    appointmentId,
    businessId,
    paidById,
    paymentMethod:
      input.paymentMethod as import("@/modules/appointments/appointment-payment").PaymentMethod,
    serviceName: serviceDefinition.name,
    servicePrice: serviceDefinition.price,
    serviceDuration: serviceDefinition.baseDuration,
    employeeName: employee.name,
    employeeId: employee.id,
    tipAmount: input.tipAmount,
    lineItems,
  });
}

export async function refundAppointment(
  fastify: FastifyInstance,
  businessId: string,
  appointmentId: string,
  refundedById: string,
  input: { reason?: string },
): Promise<void> {
  await fastify.db.appointmentPayment.refund(appointmentId, businessId, {
    refundedById,
    reason: input.reason,
  });
}
