import { z } from "zod";
import { uuid } from "../../shared/zod-utils";
import { PRODUCT_UNIT_CONSTRAINTS } from "@/constants/inventory/product-unit";

export const UnitIdParam = z.object({ unitId: uuid() });

export const CreateProductUnitSchema = z.object({
  name: z
    .string()
    .min(
      PRODUCT_UNIT_CONSTRAINTS.NAME.MIN_LENGTH,
      PRODUCT_UNIT_CONSTRAINTS.NAME.MIN_LENGTH_MESSAGE
    )
    .max(
      PRODUCT_UNIT_CONSTRAINTS.NAME.MAX_LENGTH,
      PRODUCT_UNIT_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE
    ),
  symbol: z
    .string()
    .min(
      PRODUCT_UNIT_CONSTRAINTS.SYMBOL.MIN_LENGTH,
      PRODUCT_UNIT_CONSTRAINTS.SYMBOL.MIN_LENGTH_MESSAGE
    )
    .max(
      PRODUCT_UNIT_CONSTRAINTS.SYMBOL.MAX_LENGTH,
      PRODUCT_UNIT_CONSTRAINTS.SYMBOL.MAX_LENGTH_MESSAGE
    )
    .optional(),
});

export const UpdateProductUnitSchema = z.object({
  name: z
    .string()
    .min(
      PRODUCT_UNIT_CONSTRAINTS.NAME.MIN_LENGTH,
      PRODUCT_UNIT_CONSTRAINTS.NAME.MIN_LENGTH_MESSAGE
    )
    .max(
      PRODUCT_UNIT_CONSTRAINTS.NAME.MAX_LENGTH,
      PRODUCT_UNIT_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE
    )
    .optional(),
  symbol: z
    .string()
    .min(
      PRODUCT_UNIT_CONSTRAINTS.SYMBOL.MIN_LENGTH,
      PRODUCT_UNIT_CONSTRAINTS.SYMBOL.MIN_LENGTH_MESSAGE
    )
    .max(
      PRODUCT_UNIT_CONSTRAINTS.SYMBOL.MAX_LENGTH,
      PRODUCT_UNIT_CONSTRAINTS.SYMBOL.MAX_LENGTH_MESSAGE
    )
    .optional(),
});

export type CreateProductUnitBody = z.infer<typeof CreateProductUnitSchema>;
export type UpdateProductUnitBody = z.infer<typeof UpdateProductUnitSchema>;
export type UnitIdParams = z.infer<typeof UnitIdParam>;
