import type { FastifyInstance } from "fastify";
import type Stripe from "stripe";
import { stripeService } from "../stripe-service";
import type {
  PaymentType,
  PaymentTypeHandler,
  PaymentMetadata,
  WebhookHandlerContext,
} from "./types";
import { appointmentPaymentHandler } from "./appointment-handler";

const paymentHandlers: Map<PaymentType, PaymentTypeHandler> = new Map([
  ["appointment", appointmentPaymentHandler],
  // Add new handlers here:
  // ["menu", menuPaymentHandler],
]);

function extractPaymentMetadata(
  paymentIntent: Stripe.PaymentIntent,
): PaymentMetadata | null {
  const { metadata } = paymentIntent;

  // Check for required base fields
  if (!metadata.businessId) {
    return null;
  }

  // Determine payment type from metadata
  const paymentType = metadata.paymentType as PaymentType | undefined;

  if (paymentType === "appointment" || metadata.appointmentId) {
    if (!metadata.appointmentId) {
      return null;
    }
    return {
      paymentType: "appointment",
      businessId: metadata.businessId,
      appointmentId: metadata.appointmentId,
      tipAmount: metadata.tipAmount || undefined,
      giftCardCode: metadata.giftCardCode || undefined,
    };
  }

  if (paymentType === "menu") {
    if (!metadata.orderId) {
      return null;
    }
    return {
      paymentType: "menu",
      businessId: metadata.businessId,
      orderId: metadata.orderId,
    };
  }

  return null;
}

/**
 * Get the appropriate handler for a payment type
 */
function getHandler(paymentType: PaymentType): PaymentTypeHandler | null {
  return paymentHandlers.get(paymentType) ?? null;
}

/**
 * Main webhook service for handling Stripe webhook events.
 */
export const webhookService = {
  /**
   * Check if webhooks are configured
   */
  isConfigured(): boolean {
    return stripeService.isWebhookConfigured();
  },

  /**
   * Construct and verify a webhook event from raw body and signature
   */
  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return stripeService.constructWebhookEvent(rawBody, signature);
  },

  /**
   * Process a payment_intent.succeeded event
   */
  async handlePaymentSucceeded(
    fastify: FastifyInstance,
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const metadata = extractPaymentMetadata(paymentIntent);

    if (!metadata) {
      fastify.log.debug(
        { paymentIntentId: paymentIntent.id },
        "Payment succeeded but no valid metadata found, skipping",
      );
      return;
    }

    const handler = getHandler(metadata.paymentType);

    if (!handler) {
      fastify.log.warn(
        {
          paymentType: metadata.paymentType,
          paymentIntentId: paymentIntent.id,
        },
        "No handler registered for payment type",
      );
      return;
    }

    const ctx: WebhookHandlerContext = { fastify, paymentIntent };

    try {
      const result = await handler.handlePaymentSucceeded(ctx, metadata);

      if (result.alreadyProcessed) {
        fastify.log.info(
          {
            paymentType: metadata.paymentType,
            paymentIntentId: paymentIntent.id,
          },
          "Payment already processed, skipping fulfillment",
        );
      } else if (result.success) {
        fastify.log.info(
          {
            paymentType: metadata.paymentType,
            paymentIntentId: paymentIntent.id,
          },
          "Payment fulfilled via webhook",
        );
      } else {
        fastify.log.error(
          {
            paymentType: metadata.paymentType,
            paymentIntentId: paymentIntent.id,
            message: result.message,
          },
          "Payment fulfillment failed",
        );
      }
    } catch (error) {
      fastify.log.error(
        {
          error,
          paymentType: metadata.paymentType,
          paymentIntentId: paymentIntent.id,
        },
        "Failed to fulfill payment via webhook",
      );
    }
  },

  /**
   * Process a payment_intent.payment_failed event
   */
  async handlePaymentFailed(
    fastify: FastifyInstance,
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const metadata = extractPaymentMetadata(paymentIntent);

    if (!metadata) {
      fastify.log.debug(
        { paymentIntentId: paymentIntent.id },
        "Payment failed but no valid metadata found, skipping",
      );
      return;
    }

    const handler = getHandler(metadata.paymentType);

    if (!handler) {
      fastify.log.warn(
        {
          paymentType: metadata.paymentType,
          paymentIntentId: paymentIntent.id,
        },
        "No handler registered for payment type",
      );
      return;
    }

    const ctx: WebhookHandlerContext = { fastify, paymentIntent };

    try {
      await handler.handlePaymentFailed(ctx, metadata);
    } catch (error) {
      fastify.log.error(
        {
          error,
          paymentType: metadata.paymentType,
          paymentIntentId: paymentIntent.id,
        },
        "Failed to handle payment failure via webhook",
      );
    }
  },

  /**
   * Register a new payment type handler
   */
  registerHandler(handler: PaymentTypeHandler): void {
    paymentHandlers.set(handler.paymentType, handler);
  },
};
