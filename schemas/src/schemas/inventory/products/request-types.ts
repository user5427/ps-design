import { z } from "zod";
import { uuid } from "@/schemas/shared/zod-utils";

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;

const MIN_NAME_MESSAGE = `Name must be at least ${MIN_NAME_LENGTH} characters`;
const MAX_NAME_MESSAGE = `Name must be at most ${MAX_NAME_LENGTH} characters`;

export const ProductIdParam = z.object({ productId: uuid() });

export const CreateProductSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE),
  description: z.string().optional(),
  productUnitId: uuid("Invalid product unit ID"),
});

export const UpdateProductSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} characters`)
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`)
    .optional(),
  description: z.string().optional(),
  productUnitId: uuid().optional(),
  isDisabled: z.boolean().optional(),
});

export type CreateProductBody = z.infer<typeof CreateProductSchema>;
export type UpdateProductBody = z.infer<typeof UpdateProductSchema>;
export type ProductIdParams = z.infer<typeof ProductIdParam>;
