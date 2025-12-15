import { payAppointment } from "@/routes/api/appointments/service";
import type {
  PaymentTypeHandler,
  WebhookHandlerContext,
  WebhookHandlerResult,
  AppointmentPaymentMetadata,
  PaymentMetadata,
} from "./types";

function isAppointmentMetadata(
  metadata: PaymentMetadata,
): metadata is AppointmentPaymentMetadata {
  return metadata.paymentType === "appointment";
}

/**
 * Handler for appointment payment webhooks.
 * Processes successful and failed payments for appointments.
 */
export class AppointmentPaymentHandler implements PaymentTypeHandler {
  readonly paymentType = "appointment" as const;

  async handlePaymentSucceeded(
    ctx: WebhookHandlerContext,
    metadata: PaymentMetadata,
  ): Promise<WebhookHandlerResult> {
    if (!isAppointmentMetadata(metadata)) {
      return {
        success: false,
        message: "Invalid metadata for appointment payment",
      };
    }

    const { fastify, paymentIntent } = ctx;
    const { appointmentId, businessId, tipAmount, giftCardCode } = metadata;

    // Check if appointment is already paid
    const existingPayment =
      await fastify.db.appointmentPayment.findByAppointmentIdAndBusinessId(
        appointmentId,
        businessId,
      );

    if (existingPayment) {
      return {
        success: true,
        message: "Appointment already paid",
        alreadyProcessed: true,
      };
    }

    // Get appointment to find who created it (use as paidById)
    const appointment = await fastify.db.appointment.getById(
      appointmentId,
      businessId,
    );

    // Process payment with the webhook data
    await payAppointment(
      fastify,
      businessId,
      appointmentId,
      appointment.createdById,
      {
        paymentMethod: "STRIPE",
        tipAmount: tipAmount ? parseInt(tipAmount, 10) : undefined,
        giftCardCode: giftCardCode || undefined,
        paymentIntentId: paymentIntent.id,
      },
    );

    return {
      success: true,
      message: "Appointment payment fulfilled",
    };
  }

  async handlePaymentFailed(
    ctx: WebhookHandlerContext,
    metadata: PaymentMetadata,
  ): Promise<WebhookHandlerResult> {
    if (!isAppointmentMetadata(metadata)) {
      return {
        success: false,
        message: "Invalid metadata for appointment payment",
      };
    }

    const { fastify, paymentIntent } = ctx;

    // TODO: Could implement retry, notification, or other logic here
    fastify.log.warn(
      {
        appointmentId: metadata.appointmentId,
        paymentIntentId: paymentIntent.id,
      },
      "Appointment payment failed",
    );

    return {
      success: true,
      message: "Payment failure logged",
    };
  }
}

/**
 * Singleton instance of the appointment payment handler
 */
export const appointmentPaymentHandler = new AppointmentPaymentHandler();
