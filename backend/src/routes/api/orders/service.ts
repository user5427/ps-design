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

function toOrderResponse(order: import("@/modules/order").Order): OrderResponse {
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
  const full = await fastify.db.order.getByIdAndBusinessId(order.id, businessId);
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
  const order = await fastify.db.order.updateItems(orderId, businessId, body.items);
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
  const order = await fastify.db.order.addPayment(
    orderId,
    businessId,
    body.amount,
    method,
    null,
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

  const order = await fastify.db.order.getByIdAndBusinessId(orderId, businessId);

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
