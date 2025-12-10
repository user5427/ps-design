import { z } from "zod";
import { date, datetime, uuid } from "../../shared/zod-utils";
import { createPaginatedSchema, type PaginatedType } from "../../pagination";
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
  expirationDate: date().nullable(),
  createdByUserId: uuid().nullable(),
  createdAt: datetime(),
  updatedAt: datetime(),
  deletedAt: datetime().nullable(),
  product: z.object({
    id: uuid(),
    name: z.string(),
    productUnitId: uuid(),
    productUnit: z.object({
      id: uuid(),
      name: z.string(),
      symbol: z.string().nullable(),
    }),
  }),
});

/**
 * Paginated stock level list response
 */
export const PaginatedStockLevelResponseSchema = createPaginatedSchema(
  StockLevelResponseSchema,
  "PaginatedStockLevelResponse",
);

/**
 * Paginated stock change list response
 */
export const PaginatedStockChangeResponseSchema = createPaginatedSchema(
  StockChangeResponseSchema,
  "PaginatedStockChangeResponse",
);

export type StockLevelResponse = z.infer<typeof StockLevelResponseSchema>;
export type StockChangeResponse = z.infer<typeof StockChangeResponseSchema>;
export type PaginatedStockLevelResponse = PaginatedType<
  typeof StockLevelResponseSchema
>;
export type PaginatedStockChangeResponse = PaginatedType<
  typeof StockChangeResponseSchema
>;
