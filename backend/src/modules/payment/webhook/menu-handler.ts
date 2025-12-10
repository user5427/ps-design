import { payOrder } from "@/routes/api/orders/service";
import type {
  PaymentTypeHandler,
  WebhookHandlerContext,
  WebhookHandlerResult,
  MenuPaymentMetadata,
  PaymentMetadata,
} from "./types";

function isMenuMetadata(
  metadata: PaymentMetadata,
): metadata is MenuPaymentMetadata {
  return metadata.paymentType === "menu";
}

export class MenuPaymentHandler implements PaymentTypeHandler {
  readonly paymentType = "menu" as const;

  async handlePaymentSucceeded(
    ctx: WebhookHandlerContext,
    metadata: PaymentMetadata,
  ): Promise<WebhookHandlerResult> {
    if (!isMenuMetadata(metadata)) {
      return {
        success: false,
        message: "Invalid metadata for menu payment",
      };
    }

    const { fastify, paymentIntent } = ctx;
    const { businessId, orderId } = metadata;

    // Get current order to determine if already fully paid
    const order = await fastify.db.order.getByIdAndBusinessId(
      orderId,
      businessId,
    );

    const totalPaid = (order.payments ?? [])
      .filter((p) => !p.isRefund)
      .reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid >= order.totalAmount) {
      return {
        success: true,
        message: "Order already fully paid",
        alreadyProcessed: true,
      };
    }

    const amount = paymentIntent.amount_received / 100;

    await payOrder(fastify, businessId, orderId, {
      paymentMethod: "CARD",
      amount,
      paymentIntentId: paymentIntent.id,
    });

    return {
      success: true,
      message: "Menu order payment fulfilled",
    };
  }

  async handlePaymentFailed(
    ctx: WebhookHandlerContext,
    metadata: PaymentMetadata,
  ): Promise<WebhookHandlerResult> {
    if (!isMenuMetadata(metadata)) {
      return {
        success: false,
        message: "Invalid metadata for menu payment",
      };
    }

    const { fastify, paymentIntent } = ctx;

    fastify.log.warn(
      { orderId: metadata.orderId, paymentIntentId: paymentIntent.id },
      "Menu order payment failed",
    );

    return {
      success: true,
      message: "Menu payment failure logged",
    };
  }
}

export const menuPaymentHandler = new MenuPaymentHandler();
