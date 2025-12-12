import { z } from "zod";
import { uuid } from "../../shared/zod-utils";
import { PRODUCT_CONSTRAINTS } from "../../../constants/inventory/product";

export const ProductIdParam = z.object({ productId: uuid() });

export const CreateProductSchema = z.object({
  name: z
    .string()
    .min(
      PRODUCT_CONSTRAINTS.NAME.MIN_LENGTH,
      PRODUCT_CONSTRAINTS.NAME.MIN_LENGTH_MESSAGE,
    )
    .max(
      PRODUCT_CONSTRAINTS.NAME.MAX_LENGTH,
      PRODUCT_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE,
    ),
  description: z.string().optional(),
  productUnitId: uuid("Invalid product unit ID"),
});

export const UpdateProductSchema = z.object({
  name: z
    .string()
    .min(
      PRODUCT_CONSTRAINTS.NAME.MIN_LENGTH,
      PRODUCT_CONSTRAINTS.NAME.MIN_LENGTH_MESSAGE,
    )
    .max(
      PRODUCT_CONSTRAINTS.NAME.MAX_LENGTH,
      PRODUCT_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE,
    )
    .optional(),
  description: z.string().optional(),
  productUnitId: uuid().optional(),
  isDisabled: z.boolean().optional(),
});

export type CreateProductBody = z.infer<typeof CreateProductSchema>;
export type UpdateProductBody = z.infer<typeof UpdateProductSchema>;
export type ProductIdParams = z.infer<typeof ProductIdParam>;
