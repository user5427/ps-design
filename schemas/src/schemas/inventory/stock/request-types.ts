import { z } from "zod";
import { UniversalPaginationQuerySchema } from "../../pagination";
import { date, uuid } from "../../shared/zod-utils";
import { StockChangeTypeEnum } from "./shared";

export const ChangeIdParam = z.object({ changeId: uuid() });
export const ProductIdParam = z.object({ productId: uuid() });
export const CreateChangeTypeEnum = z.enum(["SUPPLY", "ADJUSTMENT", "WASTE"]);

const BaseCreateStockChangeSchema = z
  .object({
    productId: uuid("Invalid product ID"),
    expirationDate: date().optional(),
  })
  .superRefine(({ expirationDate }, ctx) => {
    if (!expirationDate) return;

    const exp = new Date(expirationDate);
    exp.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (exp <= today) {
      ctx.addIssue({
        code: "custom",
        message: "Expiration date must be in the future",
        path: ["expirationDate"],
      });
    }
  });

export const CreateStockChangeSchema = z.discriminatedUnion("type", [
  BaseCreateStockChangeSchema.safeExtend({
    type: z.literal("SUPPLY"),
    quantity: z.number().positive("Quantity must be positive for Supply"),
  }),
  BaseCreateStockChangeSchema.safeExtend({
    type: z.literal("WASTE"),
    quantity: z.number().negative("Quantity must be negative for Waste"),
  }),
  BaseCreateStockChangeSchema.safeExtend({
    type: z.literal("ADJUSTMENT"),
    quantity: z.number().refine((val) => val !== 0, "Quantity cannot be zero"),
  }),
]);

export const UpdateStockChangeSchema = z.object({
  type: CreateChangeTypeEnum.optional(),
  quantity: z.number().optional(),
  expirationDate: date().optional(),
});

export const StockQuerySchema = UniversalPaginationQuerySchema.extend({
  productId: uuid().optional(),
  type: StockChangeTypeEnum.optional(),
});

export type CreateStockChangeBody = z.infer<typeof CreateStockChangeSchema>;
export type UpdateStockChangeBody = z.infer<typeof UpdateStockChangeSchema>;
export type StockQuery = z.infer<typeof StockQuerySchema>;
export type ChangeIdParams = z.infer<typeof ChangeIdParam>;
export type ProductIdParams = z.infer<typeof ProductIdParam>;
