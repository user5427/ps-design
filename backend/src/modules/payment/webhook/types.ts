import type { FastifyInstance } from "fastify";
import type Stripe from "stripe";

/**
 * Payment types supported by the webhook system.
 * Add new payment types here as the system grows.
 */
export type PaymentType = "appointment" | "menu";

/**
 * Metadata structure for payment intents.
 * Each payment type can have its own metadata fields.
 */
export interface BasePaymentMetadata {
  paymentType: PaymentType;
  businessId: string;
}

export interface AppointmentPaymentMetadata extends BasePaymentMetadata {
  paymentType: "appointment";
  appointmentId: string;
  tipAmount?: string;
  giftCardCode?: string;
}

export interface MenuPaymentMetadata extends BasePaymentMetadata {
  paymentType: "menu";
  orderId: string;
  // Add menu-specific fields as needed
}

export type PaymentMetadata = AppointmentPaymentMetadata | MenuPaymentMetadata;

/**
 * Context passed to webhook handlers
 */
export interface WebhookHandlerContext {
  fastify: FastifyInstance;
  paymentIntent: Stripe.PaymentIntent;
}

/**
 * Result of a webhook handler execution
 */
export interface WebhookHandlerResult {
  success: boolean;
  message: string;
  alreadyProcessed?: boolean;
}

/**
 * Interface for payment type handlers.
 * Implement this interface to add support for new payment types.
 */
export interface PaymentTypeHandler {
  /**
   * The payment type this handler processes
   */
  readonly paymentType: PaymentType;

  /**
   * Handle a successful payment
   */
  handlePaymentSucceeded(
    ctx: WebhookHandlerContext,
    metadata: PaymentMetadata,
  ): Promise<WebhookHandlerResult>;

  /**
   * Handle a failed payment
   */
  handlePaymentFailed(
    ctx: WebhookHandlerContext,
    metadata: PaymentMetadata,
  ): Promise<WebhookHandlerResult>;
}
