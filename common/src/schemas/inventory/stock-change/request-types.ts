import { z } from "zod";
import { date, uuid } from "../../shared/zod-utils";
import { STOCK_CHANGE_CONSTRAINTS } from "../../../constants/inventory/stock-change";

export const ChangeIdParam = z.object({ changeId: uuid() });
export type ChangeIdParams = z.infer<typeof ChangeIdParam>;

export const CreateChangeTypeEnum = z.enum([
  STOCK_CHANGE_CONSTRAINTS.TYPE.SUPPLY,
  STOCK_CHANGE_CONSTRAINTS.TYPE.ADJUSTMENT,
  STOCK_CHANGE_CONSTRAINTS.TYPE.WASTE,
]);

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
        message:
          STOCK_CHANGE_CONSTRAINTS.EXPIRATION_DATE.MUST_BE_FUTURE_MESSAGE,
        path: ["expirationDate"],
      });
    }
  });

export const CreateStockChangeSchema = z.discriminatedUnion("type", [
  BaseCreateStockChangeSchema.safeExtend({
    type: z.literal(STOCK_CHANGE_CONSTRAINTS.TYPE.SUPPLY),
    quantity: z
      .number()
      .positive(STOCK_CHANGE_CONSTRAINTS.QUANTITY.SUPPLY_MESSAGE),
  }),
  BaseCreateStockChangeSchema.safeExtend({
    type: z.literal(STOCK_CHANGE_CONSTRAINTS.TYPE.WASTE),
    quantity: z
      .number()
      .negative(STOCK_CHANGE_CONSTRAINTS.QUANTITY.WASTE_MESSAGE),
  }),
  BaseCreateStockChangeSchema.safeExtend({
    type: z.literal(STOCK_CHANGE_CONSTRAINTS.TYPE.ADJUSTMENT),
    quantity: z
      .number()
      .refine(
        (val) => val !== 0,
        STOCK_CHANGE_CONSTRAINTS.QUANTITY.ADJUSTMENT_MESSAGE,
      ),
  }),
]);

export const UpdateStockChangeSchema = z.object({
  type: CreateChangeTypeEnum.optional(),
  quantity: z.number().optional(),
  expirationDate: date().optional(),
});

export type CreateStockChangeBody = z.infer<typeof CreateStockChangeSchema>;
export type UpdateStockChangeBody = z.infer<typeof UpdateStockChangeSchema>;
