import { z } from "zod";
import { paginationSchema } from "../../../../shared/request-types";
import { datetime, uuid } from "../../../../shared/zod-utils";
import { stockChangeTypeEnum } from "../inventory-schemas";

export const changeIdParam = z.object({ changeId: uuid() });
export const productIdParam = z.object({ productId: uuid() });

export const createStockChangeSchema = z.object({
  productId: uuid("Invalid product ID"),
  quantity: z.number(),
  type: stockChangeTypeEnum,
  expirationDate: datetime().optional(),
});

export const stockQuerySchema = paginationSchema.extend({
  productId: uuid().optional(),
  type: stockChangeTypeEnum.optional(),
});

export type CreateStockChangeBody = z.infer<typeof createStockChangeSchema>;
export type StockQuery = z.infer<typeof stockQuerySchema>;
export type ChangeIdParams = z.infer<typeof changeIdParam>;
export type ProductIdParams = z.infer<typeof productIdParam>;
