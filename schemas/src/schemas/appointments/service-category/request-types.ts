import { z } from "zod";
import { uuid } from "../../shared/zod-utils";

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;

const MIN_NAME_MESSAGE = `Name must be at least ${MIN_NAME_LENGTH} character`;
const MAX_NAME_MESSAGE = `Name must be at most ${MAX_NAME_LENGTH} characters`;

export const ServiceCategoryIdParam = z.object({ categoryId: uuid() });

export const CreateServiceCategorySchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE),
});

export const UpdateServiceCategorySchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE)
    .optional(),
});

export type CreateServiceCategoryBody = z.infer<
  typeof CreateServiceCategorySchema
>;
export type UpdateServiceCategoryBody = z.infer<
  typeof UpdateServiceCategorySchema
>;
export type ServiceCategoryIdParams = z.infer<typeof ServiceCategoryIdParam>;
