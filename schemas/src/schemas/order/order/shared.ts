import { z } from "zod";

export const OrderStatusEnum = z.enum(["OPEN", "PAID", "CANCELLED", "REFUNDED"]);

export const PaymentMethodEnum = z.enum(["CASH", "CARD", "GIFT_CARD"]);

