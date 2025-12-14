import { z } from "zod";
import { uuid } from "../shared/zod-utils";

// === Category Request Types ===

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;

const MIN_NAME_MESSAGE = `Name must be at least ${MIN_NAME_LENGTH} character`;
const MAX_NAME_MESSAGE = `Name must be at most ${MAX_NAME_LENGTH} characters`;

export const CategoryIdParam = z.object({ categoryId: uuid() });

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE),
});

export const UpdateCategorySchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE)
    .optional(),
});

export const AssignTaxToCategorySchema = z.object({
  taxId: uuid(),
});

export type CreateCategoryBody = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryBody = z.infer<typeof UpdateCategorySchema>;
export type CategoryIdParams = z.infer<typeof CategoryIdParam>;
export type AssignTaxToCategoryBody = z.infer<typeof AssignTaxToCategorySchema>;
