import { z } from "zod";
import { PaginationSchema } from "../../shared/request-types";
import { date, uuid } from "../../shared/zod-utils";
import { StockChangeTypeEnum } from "./shared";

export const ChangeIdParam = z.object({ changeId: uuid() });
export const ProductIdParam = z.object({ productId: uuid() });
export const CreateChangeTypeEnum = z.enum(["SUPPLY", "ADJUSTMENT", "WASTE"]);


const BaseCreateStockChangeSchema = z.object({
  productId: uuid("Invalid product ID"),
  expirationDate: date().optional(),
});

export const CreateStockChangeSchema = z.discriminatedUnion("type", [
  BaseCreateStockChangeSchema.extend({
    type: z.literal("SUPPLY"),
    quantity: z.number().positive("Quantity must be positive for Supply"),
  }),
  BaseCreateStockChangeSchema.extend({
    type: z.literal("WASTE"),
    quantity: z.number().negative("Quantity must be negative for Waste"),
  }),
  BaseCreateStockChangeSchema.extend({
    type: z.literal("ADJUSTMENT"),
    quantity: z.number().refine((val) => val !== 0, "Quantity cannot be zero"),
  }),
]);

export const StockQuerySchema = PaginationSchema.extend({
  productId: uuid().optional(),
  type: StockChangeTypeEnum.optional(),
});

export type CreateStockChangeBody = z.infer<typeof CreateStockChangeSchema>;
export type StockQuery = z.infer<typeof StockQuerySchema>;
export type ChangeIdParams = z.infer<typeof ChangeIdParam>;
export type ProductIdParams = z.infer<typeof ProductIdParam>;
