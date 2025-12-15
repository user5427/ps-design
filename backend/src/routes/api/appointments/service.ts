import type { FastifyInstance } from "fastify";
import type {
  CreateAppointmentBody,
  UpdateAppointmentBody,
  AppointmentResponse,
  AppointmentStatus,
} from "@ps-design/schemas/appointments/appointment";
import type { InitiatePaymentBody } from "@ps-design/schemas/payments";
import { MINIMUM_STRIPE_PAYMENT_AMOUNT } from "@ps-design/schemas/payments";
import type { Appointment } from "@/modules/appointments/appointment/appointment.entity";
import type {
  AppointmentPayment,
  ICreatePaymentLineItem,
} from "@/modules/appointments/appointment-payment";
import type { Tax } from "@/modules/tax/tax.entity";
import type { ApplicableDiscountResult } from "@/modules/discount/discount.types";
import { stripeService } from "@/modules/payment/stripe-service";

interface PaymentCalculationResult {
  servicePrice: number;
  tipAmount: number;
  discountAmount: number;
  giftCardDiscount: number;
  taxAmount: number;
  finalAmount: number;
  applicableDiscount: ApplicableDiscountResult | null;
}

/**
 * Calculate discount amount for a service based on applicable discounts.
 */
async function calculateDiscount(
  fastify: FastifyInstance,
  businessId: string,
  serviceDefinitionId: string,
  servicePrice: number,
) {
  const applicableDiscount = await fastify.db.discount.findApplicableForService(
    businessId,
    serviceDefinitionId,
    servicePrice,
  );
  return {
    amount: applicableDiscount?.calculatedAmount ?? 0,
    discount: applicableDiscount,
  };
}

/**
 * Validate and apply gift card discount to a payment.
 */
async function applyGiftCard(
  fastify: FastifyInstance,
  businessId: string,
  giftCardCode: string | undefined,
  priceAfterDiscount: number,
  shouldRedeem: boolean = false,
) {
  if (!giftCardCode) {
    return 0;
  }

  const giftCard = shouldRedeem
    ? await fastify.db.giftCard.validateAndRedeem(giftCardCode, businessId)
    : await fastify.db.giftCard.findByCodeAndBusinessId(
        giftCardCode,
        businessId,
      );

  if (!giftCard) {
    throw new Error("Gift card not found");
  }

  if (!shouldRedeem) {
    if (giftCard.redeemedAt) {
      throw new Error("Gift card has already been redeemed");
    }
    if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
      throw new Error("Gift card has expired");
    }
  }

  return Math.min(giftCard.value, priceAfterDiscount);
}

/**
 * Calculate tax amount based on service category tax rate.
 */
function calculateTax(
  servicePrice: number,
  discountAmount: number,
  categoryTax: Tax | null | undefined,
): number {
  if (!categoryTax) {
    return 0;
  }

  const taxRate = Number(categoryTax.rate);
  const taxableAmount = Math.max(0, servicePrice - discountAmount);
  return Math.round(taxableAmount * (taxRate / 100));
}

/**
 * Calculate the final payment amount including all adjustments.
 */
async function calculatePaymentAmount(
  fastify: FastifyInstance,
  businessId: string,
  servicePrice: number,
  serviceDefinitionId: string,
  tipAmount: number | undefined,
  giftCardCode: string | undefined,
  categoryTax: Tax | null | undefined,
  shouldRedeemGiftCard: boolean = false,
): Promise<PaymentCalculationResult> {
  const adjustedTipAmount = tipAmount ?? 0;

  const { amount: discountAmount, discount: applicableDiscount } =
    await calculateDiscount(
      fastify,
      businessId,
      serviceDefinitionId,
      servicePrice,
    );

  const priceAfterDiscount = Math.max(0, servicePrice - discountAmount);
  const giftCardDiscount = await applyGiftCard(
    fastify,
    businessId,
    giftCardCode,
    priceAfterDiscount,
    shouldRedeemGiftCard,
  );

  const taxAmount = calculateTax(servicePrice, discountAmount, categoryTax);

  const finalAmount = Math.max(
    0,
    servicePrice +
      adjustedTipAmount -
      discountAmount -
      giftCardDiscount +
      taxAmount,
  );

  return {
    servicePrice,
    tipAmount: adjustedTipAmount,
    discountAmount,
    giftCardDiscount,
    taxAmount,
    finalAmount,
    applicableDiscount,
  };
}

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
): Promise<AppointmentResponse> {
  return toAppointmentResponse(
    await fastify.db.appointment.create({
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      startTime: new Date(input.startTime),
      notes: input.notes,
      serviceId: input.serviceId,
      businessId,
      createdById,
    }),
  );
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
): Promise<AppointmentResponse> {
  return toAppointmentResponse(
    await fastify.db.appointment.update(appointmentId, businessId, {
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      notes: input.notes,
    }),
  );
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

/**
 * Initiate a Stripe payment for an appointment.
 * The server calculates the final amount and creates the PaymentIntent.
 */
export async function initiatePayment(
  fastify: FastifyInstance,
  businessId: string,
  appointmentId: string,
  input: Omit<InitiatePaymentBody, "appointmentId">,
): Promise<{
  clientSecret: string;
  paymentIntentId: string;
  finalAmount: number;
  breakdown: {
    servicePrice: number;
    tipAmount: number;
    giftCardDiscount: number;
    discountAmount: number;
    taxAmount: number;
  };
}> {
  if (!stripeService.isConfigured()) {
    throw new Error("Stripe is not configured");
  }

  const appointment = await fastify.db.appointment.getById(
    appointmentId,
    businessId,
  );

  if (appointment.status !== "RESERVED") {
    throw new Error("Only reserved appointments can be paid");
  }

  if (appointment.payment) {
    throw new Error("This appointment has already been paid");
  }

  const calculation = await calculatePaymentAmount(
    fastify,
    businessId,
    appointment.service.serviceDefinition.price,
    appointment.service.serviceDefinition.id,
    input.tipAmount,
    input.giftCardCode,
    appointment.service.serviceDefinition.category?.tax,
    false, // Don't redeem gift card during initiation
  );

  if (calculation.finalAmount < MINIMUM_STRIPE_PAYMENT_AMOUNT) {
    throw new Error(
      "Amount too low for card payment (minimum €0.50). Use cash or gift card instead.",
    );
  }

  const result = await stripeService.createPaymentIntent({
    amount: calculation.finalAmount,
    currency: "eur",
    metadata: {
      appointmentId,
      businessId,
      tipAmount: calculation.tipAmount.toString(),
      giftCardCode: input.giftCardCode ?? "",
      discountId: calculation.applicableDiscount?.discount.id ?? "",
    },
  });

  return {
    clientSecret: result.clientSecret,
    paymentIntentId: result.paymentIntentId,
    finalAmount: calculation.finalAmount,
    breakdown: {
      servicePrice: calculation.servicePrice,
      tipAmount: calculation.tipAmount,
      giftCardDiscount: calculation.giftCardDiscount,
      discountAmount: calculation.discountAmount,
      taxAmount: calculation.taxAmount,
    },
  };
}

export async function payAppointment(
  fastify: FastifyInstance,
  businessId: string,
  appointmentId: string,
  paidById: string,
  input: {
    paymentMethod: string;
    tipAmount?: number;
    giftCardCode?: string;
    paymentIntentId?: string;
  },
): Promise<AppointmentPayment> {
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

  const calculation = await calculatePaymentAmount(
    fastify,
    businessId,
    serviceDefinition.price,
    serviceDefinition.id,
    input.tipAmount,
    input.giftCardCode,
    serviceDefinition.category?.tax,
    true, // Redeem gift card during payment
  );

  const lineItems: ICreatePaymentLineItem[] = [
    {
      type: "SERVICE",
      label: serviceDefinition.name,
      amount: serviceDefinition.price,
    },
  ];

  if (calculation.tipAmount > 0) {
    lineItems.push({
      type: "TIP",
      label: "Tip",
      amount: calculation.tipAmount,
    });
  }

  if (calculation.discountAmount > 0) {
    lineItems.push({
      type: "DISCOUNT",
      label: `Discount (${calculation.applicableDiscount?.discount.name})`,
      amount: -calculation.discountAmount,
    });
  }

  if (calculation.giftCardDiscount > 0) {
    lineItems.push({
      type: "DISCOUNT",
      label: `Gift Card (${input.giftCardCode})`,
      amount: -calculation.giftCardDiscount,
    });
  }

  if (calculation.taxAmount > 0) {
    lineItems.push({
      type: "TAX",
      label: `Tax (${serviceDefinition.category?.tax?.name} ${Number(serviceDefinition.category?.tax?.rate)}%)`,
      amount: calculation.taxAmount,
    });
  }

  return await fastify.db.appointmentPayment.create({
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
    tipAmount: calculation.tipAmount,
    lineItems,
    externalPaymentId: input.paymentIntentId,
  });
}

export async function refundAppointment(
  fastify: FastifyInstance,
  businessId: string,
  appointmentId: string,
  refundedById: string,
  input: { reason?: string },
): Promise<AppointmentPayment> {
  const payment =
    await fastify.db.appointmentPayment.findByAppointmentIdAndBusinessId(
      appointmentId,
      businessId,
    );

  if (!payment) {
    throw new Error("Payment not found for this appointment");
  }

  if (payment.paymentMethod === "STRIPE" && payment.externalPaymentId) {
    if (!stripeService.isConfigured()) {
      throw new Error("Stripe is not configured, cannot process refund");
    }

    await stripeService.refundPayment({
      paymentIntentId: payment.externalPaymentId,
    });
  }

  return await fastify.db.appointmentPayment.refund(appointmentId, businessId, {
    refundedById,
    reason: input.reason,
  });
}
