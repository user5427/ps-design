import { z } from "zod";
import { createPaginatedSchema, type PaginatedType } from "../../pagination";
import { uuid, datetime, date } from "../../shared/zod-utils";

// Use the enum from shared
export const StockChangeTypeEnum = z.enum([
  "SUPPLY",
  "USAGE",
  "ADJUSTMENT",
  "WASTE",
]);

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

export const PaginatedStockChangeResponseSchema = createPaginatedSchema(
  StockChangeResponseSchema,
  "PaginatedStockChangeResponse",
);

export type StockChangeResponse = z.infer<typeof StockChangeResponseSchema>;
export type PaginatedStockChangeResponse = PaginatedType<
  typeof StockChangeResponseSchema
>;
