import { z } from "zod";
import { createPaginatedSchema, type PaginatedType } from "../../pagination";
import { uuid } from "../../shared/zod-utils";

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

export const PaginatedStockLevelResponseSchema = createPaginatedSchema(
  StockLevelResponseSchema,
  "PaginatedStockLevelResponse",
);

export type StockLevelResponse = z.infer<typeof StockLevelResponseSchema>;
export type PaginatedStockLevelResponse = PaginatedType<
  typeof StockLevelResponseSchema
>;
