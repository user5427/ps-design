import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";
import { StockChangeTypeEnum } from "./shared";

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
  type: StockChangeTypeEnum,
  expirationDate: datetime().nullable(),
  createdByUserId: uuid().nullable(),
  createdAt: datetime(),
  updatedAt: datetime(),
  deletedAt: datetime().nullable(),
  product: z.object({
    id: uuid(),
    name: z.string(),
    description: z.string().nullable(),
    productUnitId: uuid(),
    businessId: uuid(),
    isDisabled: z.boolean(),
    createdAt: datetime(),
    updatedAt: datetime(),
    productUnit: z.object({
      id: uuid(),
      name: z.string(),
      symbol: z.string().nullable(),
    }).optional(),
  }).optional(),
});

export type StockLevelResponse = z.infer<typeof StockLevelResponseSchema>;
export type StockChangeResponse = z.infer<typeof StockChangeResponseSchema>;
