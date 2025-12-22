import type { FastifyInstance } from "fastify";
import type {
  CreateOrderBody,
  OrderIdParams,
  OrderResponse,
  PayOrderBody,
  RefundOrderBody,
  UpdateOrderWaiterBody,
  UpdateOrderItemsBody,
  UpdateOrderTotalsBody,
} from "@ps-design/schemas/order/order";
import type { GiftCard } from "@/modules/gift-card/gift-card.entity";
import { stripeService } from "@/modules/payment/stripe-service";
import { MINIMUM_STRIPE_PAYMENT_AMOUNT } from "@ps-design/schemas/payments";

import type {
  ListOrdersQuery,
  OrderListResponse,
} from "@ps-design/schemas/order/order";
import { Order } from "@/modules/order";

export async function listOrders(
  fastify: FastifyInstance,
  businessId: string,
  query: ListOrdersQuery,
): Promise<OrderListResponse> {
  const orderRepo = fastify.db.dataSource.getRepository(Order);
  const { status, excludeOpen, page, limit } = query;
  const skip = (page - 1) * limit;

  const qb = orderRepo
    .createQueryBuilder("order")
    .leftJoinAndSelect("order.servedByUser", "user")
    .where("order.businessId = :businessId", { businessId })
    .orderBy("order.createdAt", "DESC")
    .skip(skip)
    .take(limit);

  if (status) {
    qb.andWhere("order.status = :status", { status });
  } else if (excludeOpen) {
    qb.andWhere("order.status != :openStatus", { openStatus: "OPEN" });
  }

  const [orders, total] = await qb.getManyAndCount();

  const totalPages = Math.ceil(total / limit);

  return {
    data: orders.map((o) => ({
      id: o.id,
      tableId: o.tableId,
      servedByUserName: o.servedByUser?.name ?? null,
      status: o.status,
      totalAmount: o.totalAmount,
      itemCount: o.itemsTotal,
      createdAt: o.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export interface OrderItemForDiscount {
  menuItemId: string;
  unitPrice: number; // base + variations included
  quantity: number;
}

function toOrderResponse(
  order: import("@/modules/order").Order,
): OrderResponse {
  return {
    id: order.id,
    businessId: order.businessId,
    tableId: order.tableId,
    servedByUserId: order.servedByUserId,
    servedByUserName: order.servedByUser?.name ?? null,
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

export async function getOrderItemsForDiscount(
  fastify: FastifyInstance,
  orderId: string,
  businessId: string,
): Promise<OrderItemForDiscount[]> {
  // Fetch the order including items and variations
  const order = await fastify.db.order.getByIdAndBusinessId(
    orderId,
    businessId,
  );

  // Map order items to OrderItemForDiscount
  const items: OrderItemForDiscount[] = order.orderItems.map((item) => {
    const variationTotal =
      item.variations?.reduce((sum, v) => sum + v.snapPriceAdjustment, 0) ?? 0;

    const unitPrice = item.snapBasePrice + variationTotal;

    return {
      menuItemId: item.menuItemId,
      unitPrice, // base + variations
      quantity: item.quantity,
    };
  });

  return items;
}

export async function getBestDiscountForOrder(
  fastify: FastifyInstance,
  businessId: string,
  orderId: string,
): Promise<number> {
  const items = await getOrderItemsForDiscount(fastify, orderId, businessId);
  const discountAmount = await fastify.db.discount.findApplicableForOrder(
    businessId,
    items,
  );
  return discountAmount;
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

  const discountAmount = await getBestDiscountForOrder(
    fastify,
    businessId,
    orderId,
  );

  const updatedOrder = await fastify.db.order.updateTotals(
    orderId,
    businessId,
    0,
    discountAmount,
  );
  return toOrderResponse(updatedOrder);
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
  // body.discountAmount = MANUAL discount only
  // Auto-discount is calculated fresh to avoid double-application
  const autoDiscount = await getBestDiscountForOrder(
    fastify,
    businessId,
    orderId,
  );
  const totalDiscount = body.discountAmount + autoDiscount;

  const order = await fastify.db.order.updateTotals(
    orderId,
    businessId,
    body.tipAmount,
    totalDiscount,
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

    let giftCard: GiftCard;
    try {
      giftCard = await fastify.db.giftCard.validateAndRedeem(
        body.giftCardCode,
        businessId,
      );
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (
        error &&
        (error.code === "GIFT_CARD_ALREADY_REDEEMED" ||
          error.message?.includes("already redeemed"))
      ) {
        throw new Error(
          "Gift card has already been redeemed or is no longer valid",
        );
      }
      throw err;
    }

    const giftCardAmount = giftCard.value;
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

  // Determine how much can/should be refunded via Stripe
  let refundedViaStripe = 0;

  const cardPayments = (existing.payments ?? []).filter(
    (p) => !p.isRefund && p.method === "CARD" && p.externalReferenceId,
  );

  const totalCardPaid = cardPayments.reduce((sum, p) => sum + p.amount, 0);

  if (
    stripeService.isConfigured() &&
    cardPayments.length > 0 &&
    totalCardPaid > 0
  ) {
    // Only refund up to the total amount that was actually paid by card,
    // and up to the requested refund amount
    refundedViaStripe = Math.min(amount, totalCardPaid);

    if (refundedViaStripe > 0) {
      let remainingRefund = refundedViaStripe;
      for (const cardPayment of cardPayments) {
        if (remainingRefund <= 0) break;
        const paymentIntentId = cardPayment.externalReferenceId as string;
        // Calculate the max refundable for this payment
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

  let updatedOrder = existing;

  // 1. Record Stripe (CARD) refund if applicable
  if (refundedViaStripe > 0) {
    updatedOrder = await fastify.db.order.addPayment(
      orderId,
      businessId,
      refundedViaStripe,
      "CARD" as import("@/modules/order").PaymentMethod,
      null, // We don't track the *refund* ID from Stripe here, but could if schema supported it
      true,
    );
  }

  // 2. Record remaining amount as CASH refund
  const remainingCashRefund = amount - refundedViaStripe;
  if (remainingCashRefund > 0) {
    updatedOrder = await fastify.db.order.addPayment(
      orderId,
      businessId,
      remainingCashRefund,
      "CASH" as import("@/modules/order").PaymentMethod,
      null,
      true,
    );
  }

  return toOrderResponse(updatedOrder);
}

export async function initiateOrderStripePayment(
  fastify: FastifyInstance,
  businessId: string,
  orderId: string,
  amount?: number, // optional manual amount in major units
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

  let amountToPay = remaining;

  // If specific amount requested, validate and use it
  if (amount !== undefined) {
    if (amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }
    if (amount > remaining + 0.01) {
      // allow small epsilon
      throw new Error(
        `Payment amount cannot exceed remaining balance of ${remaining.toFixed(2)}€`,
      );
    }
    amountToPay = amount;
  }

  const amountToPayCents = Math.round(amountToPay * 100);

  if (amountToPayCents < MINIMUM_STRIPE_PAYMENT_AMOUNT) {
    throw new Error(
      "Amount too low for card payment (minimum €0.50). Use cash or gift card instead.",
    );
  }

  const result = await stripeService.createPaymentIntent({
    amount: amountToPayCents,
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
    finalAmount: amountToPay,
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

export async function updateOrderWaiter(
  fastify: FastifyInstance,
  businessId: string,
  orderId: string,
  body: UpdateOrderWaiterBody,
): Promise<OrderResponse> {
  const order = await fastify.db.order.updateWaiter(
    orderId,
    businessId,
    body.servedByUserId ?? null,
  );
  return toOrderResponse(order);
}
