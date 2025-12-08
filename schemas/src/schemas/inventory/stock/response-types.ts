import { z } from "zod";
import { datetime, uuid } from "@/schemas/shared/zod-utils";

export const StockLevelResponseSchema = z.object({
  productId: uuid(),
  productName: z.string(),
  productUnit: z.object({
    id: uuid(),
    name: z.string(),
    symbol: z.string().nullable(),
  }),
  isDisabled: z.boolean(),
  totalQuantity: z.number(),
});

export const StockChangeResponseSchema = z.object({
  id: uuid(),
  productId: uuid(),
  businessId: uuid(),
  quantity: z.number(),
  type: z.string(),
  expirationDate: datetime().nullable(),
  createdByUserId: uuid().nullable(),
  createdAt: datetime(),
  updatedAt: datetime(),
  deletedAt: datetime().nullable(),
});

export type StockLevelResponse = z.infer<typeof StockLevelResponseSchema>;
export type StockChangeResponse = z.infer<typeof StockChangeResponseSchema>;
