import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";
import { OrderStatusEnum, PaymentMethodEnum } from "./shared";

export const OrderItemVariationSchema = z.object({
  id: uuid(),
  variationId: uuid(),
  snapVariationName: z.string(),
  snapPriceAdjustment: z.number(), // major units (e.g. euros)
});

export const OrderItemSchema = z.object({
  id: uuid(),
  menuItemId: uuid(),
  snapName: z.string(),
  snapBasePrice: z.number(), // major units
  unitSalePrice: z.number(), // major units
  quantity: z.number().int().positive(),
  lineTotal: z.number(), // major units
  status: z.enum(["PENDING", "SENT", "VOIDED"]),
  variations: z.array(OrderItemVariationSchema),
});

export const OrderPaymentSchema = z.object({
  id: uuid(),
  amount: z.number(), // major units
  method: PaymentMethodEnum,
  externalReferenceId: z.string().nullable(),
  isRefund: z.boolean(),
  createdAt: datetime(),
});

export const OrderResponseSchema = z.object({
  id: uuid(),
  businessId: uuid(),
  tableId: uuid().nullable(),
  servedByUserId: uuid().nullable(),
  servedByUserName: z.string().nullable(),
  status: OrderStatusEnum,
  itemsTotal: z.number(),
  totalTax: z.number(),
  totalTip: z.number(),
  totalDiscount: z.number(),
  totalAmount: z.number(),
  orderItems: z.array(OrderItemSchema),
  payments: z.array(OrderPaymentSchema),
  createdAt: datetime(),
  updatedAt: datetime(),
});

export type OrderResponse = z.infer<typeof OrderResponseSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrderPayment = z.infer<typeof OrderPaymentSchema>;

// Lighter response for list views
export const OrderSummarySchema = z.object({
  id: uuid(),
  tableId: uuid().nullable(),
  servedByUserName: z.string().nullable(),
  status: OrderStatusEnum,
  totalAmount: z.number(),
  itemCount: z.number().int(),
  createdAt: datetime(),
});

export const OrderListResponseSchema = z.object({
  data: z.array(OrderSummarySchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type OrderSummary = z.infer<typeof OrderSummarySchema>;
export type OrderListResponse = z.infer<typeof OrderListResponseSchema>;
