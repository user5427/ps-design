import { z } from "zod";
import { PaginationSchema } from "../../shared/request-types";
import { date, uuid } from "../../shared/zod-utils";
import { StockChangeTypeEnum } from "./shared";

export const ChangeIdParam = z.object({ changeId: uuid() });
export const ProductIdParam = z.object({ productId: uuid() });
export const CreateChangeTypeEnum = z.enum(["SUPPLY", "ADJUSTMENT", "WASTE"]);

export const CreateStockChangeSchema = z.object({
  productId: uuid("Invalid product ID"),
  quantity: z.number(),
  type: CreateChangeTypeEnum,
  expirationDate: date().optional(),
});

export const UpdateStockChangeSchema = z.object({
  quantity: z.number().optional(),
  type: CreateChangeTypeEnum.optional(),
  expirationDate: date().optional().nullable(),
});

export const StockQuerySchema = PaginationSchema.extend({
  productId: uuid().optional(),
  type: StockChangeTypeEnum.optional(),
});

export type CreateStockChangeBody = z.infer<typeof CreateStockChangeSchema>;
export type UpdateStockChangeBody = z.infer<typeof UpdateStockChangeSchema>;
export type StockQuery = z.infer<typeof StockQuerySchema>;
export type ChangeIdParams = z.infer<typeof ChangeIdParam>;
export type ProductIdParams = z.infer<typeof ProductIdParam>;
