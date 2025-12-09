import { z } from "zod";
import { uuid } from "../../shared/zod-utils";

// === Menu Item Category ===

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 50;

const MIN_NAME_MESSAGE = `Name must be at least ${MIN_NAME_LENGTH} characters`;
const MAX_NAME_MESSAGE = `Name must be at most ${MAX_NAME_LENGTH} characters`;

export const CategoryIdParam = z.object({ categoryId: uuid() });

export const CreateMenuItemCategorySchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE),
});

export const UpdateMenuItemCategorySchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE)
    .optional(),
});

export type CreateMenuItemCategoryBody = z.infer<
  typeof CreateMenuItemCategorySchema
>;
export type UpdateMenuItemCategoryBody = z.infer<
  typeof UpdateMenuItemCategorySchema
>;
export type CategoryIdParams = z.infer<typeof CategoryIdParam>;
