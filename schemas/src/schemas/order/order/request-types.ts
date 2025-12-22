import { z } from "zod";
import { uuid } from "../../shared/zod-utils";
import { PaymentMethodEnum } from "./shared";

export const OrderIdParam = z.object({
  orderId: uuid(),
});

export const CreateOrderSchema = z.object({
  tableId: uuid().nullable(),
});

export const OrderItemInputSchema = z.object({
  menuItemId: uuid(),
  quantity: z.number().int().positive(),
  variationIds: z.array(uuid()).default([]),
});

export const UpdateOrderItemsSchema = z.object({
  items: z.array(OrderItemInputSchema),
});

export const UpdateOrderTotalsSchema = z.object({
  tipAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
});

export const PayOrderSchema = z.object({
  paymentMethod: PaymentMethodEnum,
  amount: z.number().min(0), // major units
  // When paying via Stripe, this links the payment to a PaymentIntent
  paymentIntentId: z.string().optional(),
  // When paying via gift card, this is the code to redeem
  giftCardCode: z.string().max(50).optional(),
});

export const RefundOrderSchema = z.object({
  amount: z.number().min(0).optional(), // if omitted, full refund
  reason: z.string().max(500).optional(),
});

export const UpdateOrderWaiterSchema = z.object({
  servedByUserId: uuid().nullable(),
});

export type OrderIdParams = z.infer<typeof OrderIdParam>;
export type CreateOrderBody = z.infer<typeof CreateOrderSchema>;
export type OrderItemInput = z.infer<typeof OrderItemInputSchema>;
export type UpdateOrderItemsBody = z.infer<typeof UpdateOrderItemsSchema>;
export type UpdateOrderTotalsBody = z.infer<typeof UpdateOrderTotalsSchema>;
export type PayOrderBody = z.infer<typeof PayOrderSchema>;
export type RefundOrderBody = z.infer<typeof RefundOrderSchema>;
export type UpdateOrderWaiterBody = z.infer<typeof UpdateOrderWaiterSchema>;

export const InitiateOrderPaymentSchema = z.object({
  amount: z.number().min(0).optional(), // major units
});

export type InitiateOrderPaymentBody = z.infer<
  typeof InitiateOrderPaymentSchema
>;

export const ListOrdersQuerySchema = z.object({
  status: z.enum(["OPEN", "PAID", "CANCELLED", "REFUNDED"]).optional(),
  excludeOpen: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListOrdersQuery = z.infer<typeof ListOrdersQuerySchema>;
