import type { FastifyInstance } from "fastify";
import type {
  CreateOrderBody,
  OrderIdParams,
  OrderResponse,
  PayOrderBody,
  RefundOrderBody,
  UpdateOrderItemsBody,
  UpdateOrderTotalsBody,
} from "@ps-design/schemas/order/order";
import { stripeService } from "@/modules/payment/stripe-service";
import { MINIMUM_STRIPE_PAYMENT_AMOUNT } from "@ps-design/schemas/payments";

function toOrderResponse(
  order: import("@/modules/order").Order,
): OrderResponse {
  return {
    id: order.id,
    businessId: order.businessId,
    tableId: order.tableId,
    status: order.status,
    itemsTotal: order.itemsTotal,
    totalTax: order.totalTax,
    totalTip: order.totalTip,
    totalDiscount: order.totalDiscount,
    totalAmount: order.totalAmount,
    orderItems: (order.orderItems ?? []).map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      snapName: item.snapName,
      snapBasePrice: item.snapBasePrice,
      unitSalePrice: item.unitSalePrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      status: item.status,
      variations: (item.variations ?? []).map((v) => ({
        id: v.id,
        variationId: v.menuItemVariationId,
        snapVariationName: v.snapVariationName,
        snapPriceAdjustment: v.snapPriceAdjustment,
      })),
    })),
    payments: (order.payments ?? []).map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      externalReferenceId: p.externalReferenceId,
      isRefund: p.isRefund,
      createdAt: p.createdAt.toISOString(),
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function createOrder(
  fastify: FastifyInstance,
  businessId: string,
  body: CreateOrderBody,
): Promise<OrderResponse> {
  const order = await fastify.db.order.createForTable(
    businessId,
    body.tableId ?? null,
  );
  const full = await fastify.db.order.getByIdAndBusinessId(
    order.id,
    businessId,
  );
  return toOrderResponse(full);
}

export async function getOrder(
  fastify: FastifyInstance,
  businessId: string,
  params: OrderIdParams,
): Promise<OrderResponse> {
  const order = await fastify.db.order.getByIdAndBusinessId(
    params.orderId,
    businessId,
  );
  return toOrderResponse(order);
}

export async function updateOrderItems(
  fastify: FastifyInstance,
  businessId: string,
  orderId: string,
  body: UpdateOrderItemsBody,
): Promise<OrderResponse> {
  const order = await fastify.db.order.updateItems(
    orderId,
    businessId,
    body.items,
  );
  return toOrderResponse(order);
}

export async function sendOrderItems(
  fastify: FastifyInstance,
  businessId: string,
  orderId: string,
  userId: string,
): Promise<OrderResponse> {
  const order = await fastify.db.order.sendPendingItems(
    orderId,
    businessId,
    userId,
  );
  return toOrderResponse(order);
}

export async function updateOrderTotals(
  fastify: FastifyInstance,
  businessId: string,
  orderId: string,
  body: UpdateOrderTotalsBody,
): Promise<OrderResponse> {
  const order = await fastify.db.order.updateTotals(
    orderId,
    businessId,
    body.tipAmount,
    body.discountAmount,
  );
  return toOrderResponse(order);
}

export async function payOrder(
  fastify: FastifyInstance,
  businessId: string,
  orderId: string,
  body: PayOrderBody,
): Promise<OrderResponse> {
  const method = body.paymentMethod as import("@/modules/order").PaymentMethod;

  // Guard against duplicate Stripe webhook deliveries or retries by
  // short‑circuiting if we already have a non‑refund payment recorded
  // for this paymentIntentId.
  if (method === "CARD" && body.paymentIntentId) {
    const existing = await fastify.db.order.getByIdAndBusinessId(
      orderId,
      businessId,
    );

    const alreadyRecorded = (existing.payments ?? []).some(
      (p) => !p.isRefund && p.externalReferenceId === body.paymentIntentId,
    );

    if (alreadyRecorded) {
      return toOrderResponse(existing);
    }
  }

  // Special handling for gift card payments: validate and redeem code, and
  // apply up to the remaining order amount from the card's value.
  if (method === "GIFT_CARD") {
    if (!body.giftCardCode) {
      throw new Error("Gift card code is required for gift card payments");
    }

    // Load current order to determine remaining balance
    const existing = await fastify.db.order.getByIdAndBusinessId(
      orderId,
      businessId,
    );

    const totalPaid = (existing.payments ?? [])
      .filter((p) => !p.isRefund)
      .reduce((sum, p) => sum + p.amount, 0);

    const remaining = Math.max(0, existing.totalAmount - totalPaid);

    if (remaining <= 0) {
      throw new Error("Order is already fully paid");
    }

    // Validate and redeem the gift card.
    // NOTE: validateAndRedeem must be implemented atomically to prevent race conditions.
    let giftCard;
    try {
      giftCard = await fastify.db.giftCard.validateAndRedeem(
        body.giftCardCode,
        businessId,
      );
    } catch (err: any) {
      // Handle race condition or already redeemed error
      if (err && (err.code === "GIFT_CARD_ALREADY_REDEEMED" || err.message?.includes("already redeemed"))) {
        throw new Error("Gift card has already been redeemed or is no longer valid");
      }
      throw err;
    }

    const giftCardAmount = giftCard.value; // already in major units
    const amountToApply = Math.min(remaining, giftCardAmount);

    if (amountToApply <= 0) {
      throw new Error("Gift card value is too low to apply to this order");
    }

    const updatedOrder = await fastify.db.order.addPayment(
      orderId,
      businessId,
      amountToApply,
      method,
      giftCard.id,
      false,
    );

    return toOrderResponse(updatedOrder);
  }

  const order = await fastify.db.order.addPayment(
    orderId,
    businessId,
    body.amount,
    method,
    body.paymentIntentId ?? null,
    false,
  );
  return toOrderResponse(order);
}

export async function refundOrder(
  fastify: FastifyInstance,
  businessId: string,
  orderId: string,
  body: RefundOrderBody,
): Promise<OrderResponse> {
  const existing = await fastify.db.order.getByIdAndBusinessId(
    orderId,
    businessId,
  );

  const totalPaid = (existing.payments ?? [])
    .filter((p) => !p.isRefund)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = (existing.payments ?? [])
    .filter((p) => p.isRefund)
    .reduce((sum, p) => sum + p.amount, 0);

  const refundable = Math.max(0, totalPaid - totalRefunded);

  const amount = body.amount !== undefined ? body.amount : refundable;

  if (amount <= 0 || amount > refundable) {
    throw new Error("Invalid refund amount");
  }

  // If there were card payments processed via Stripe, attempt to refund them
  const cardPayments = (existing.payments ?? []).filter(
    (p) => !p.isRefund && p.method === "CARD" && p.externalReferenceId,
  );

  const totalCardPaid = cardPayments.reduce((sum, p) => sum + p.amount, 0);

  if (
    stripeService.isConfigured() &&
    cardPayments.length > 0 &&
    totalCardPaid > 0
  ) {
    // Only refund up to the total amount that was actually paid by card
    const stripeRefundAmount = Math.min(amount, totalCardPaid);

    if (stripeRefundAmount > 0) {
      let remainingRefund = stripeRefundAmount;
      for (const cardPayment of cardPayments) {
        if (remainingRefund <= 0) break;
        const paymentIntentId = cardPayment.externalReferenceId as string;
        // Calculate the max refundable for this payment (in case of partial refunds in the future)
        const maxRefundable = Math.min(cardPayment.amount, remainingRefund);
        if (maxRefundable > 0) {
          await stripeService.refundPayment({
            paymentIntentId,
            amount: Math.round(maxRefundable * 100),
          });
          remainingRefund -= maxRefundable;
        }
      }
    }
  }

  const order = await fastify.db.order.addPayment(
    orderId,
    businessId,
    amount,
    "CASH" as import("@/modules/order").PaymentMethod,
    null,
    true,
  );

  return toOrderResponse(order);
}

export async function initiateOrderStripePayment(
  fastify: FastifyInstance,
  businessId: string,
  orderId: string,
): Promise<{
  clientSecret: string;
  paymentIntentId: string;
  finalAmount: number;
}> {
  if (!stripeService.isConfigured()) {
    throw new Error("Stripe is not configured");
  }

  const order = await fastify.db.order.getByIdAndBusinessId(
    orderId,
    businessId,
  );

  const totalPaid = (order.payments ?? [])
    .filter((p) => !p.isRefund)
    .reduce((sum, p) => sum + p.amount, 0);

  const remaining = Math.max(0, order.totalAmount - totalPaid);

  const remainingCents = Math.round(remaining * 100);

  if (remainingCents < MINIMUM_STRIPE_PAYMENT_AMOUNT) {
    throw new Error(
      "Amount too low for card payment (minimum €0.50). Use cash or gift card instead.",
    );
  }

  const result = await stripeService.createPaymentIntent({
    amount: remainingCents,
    currency: "eur",
    metadata: {
      paymentType: "menu",
      businessId,
      orderId,
    },
  });

  return {
    clientSecret: result.clientSecret,
    paymentIntentId: result.paymentIntentId,
    finalAmount: remaining,
  };
}

export async function cancelOrder(
  fastify: FastifyInstance,
  businessId: string,
  orderId: string,
): Promise<OrderResponse> {
  const order = await fastify.db.order.cancel(orderId, businessId);
  return toOrderResponse(order);
}
