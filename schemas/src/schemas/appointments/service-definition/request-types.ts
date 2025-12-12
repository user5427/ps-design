import { z } from "zod";
import { uuid } from "../../shared/zod-utils";

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MIN_PRICE = 0; // 0 cents
const MIN_DURATION = 1; // At least 1 minute
const MAX_DURATION = 480; // Max 8 hours

const MIN_NAME_MESSAGE = `Name must be at least ${MIN_NAME_LENGTH} character`;
const MAX_NAME_MESSAGE = `Name must be at most ${MAX_NAME_LENGTH} characters`;
const MAX_DESCRIPTION_MESSAGE = `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`;
const MIN_PRICE_MESSAGE = `Price must be at least ${MIN_PRICE} cents`;
const MIN_DURATION_MESSAGE = `Duration must be at least ${MIN_DURATION} minute`;
const MAX_DURATION_MESSAGE = `Duration must be at most ${MAX_DURATION} minutes`;

export const ServiceDefinitionIdParam = z.object({
  serviceDefinitionId: uuid(),
});

export const CreateServiceDefinitionSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE),
  description: z
    .string()
    .max(MAX_DESCRIPTION_LENGTH, MAX_DESCRIPTION_MESSAGE)
    .nullable()
    .optional(),
  price: z
    .number()
    .int("Price must be an integer (cents)")
    .min(MIN_PRICE, MIN_PRICE_MESSAGE),
  duration: z
    .number()
    .int()
    .min(MIN_DURATION, MIN_DURATION_MESSAGE)
    .max(MAX_DURATION, MAX_DURATION_MESSAGE),
  isDisabled: z.boolean().optional().default(false),
  categoryId: uuid().nullable().optional(),
});

export const UpdateServiceDefinitionSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE)
    .optional(),
  description: z
    .string()
    .max(MAX_DESCRIPTION_LENGTH, MAX_DESCRIPTION_MESSAGE)
    .nullable()
    .optional(),
  price: z
    .number()
    .int("Price must be an integer (cents)")
    .min(MIN_PRICE, MIN_PRICE_MESSAGE)
    .optional(),
  duration: z
    .number()
    .int()
    .min(MIN_DURATION, MIN_DURATION_MESSAGE)
    .max(MAX_DURATION, MAX_DURATION_MESSAGE)
    .optional(),
  isDisabled: z.boolean().optional(),
  categoryId: uuid().nullable().optional(),
});

export type CreateServiceDefinitionBody = z.infer<
  typeof CreateServiceDefinitionSchema
>;
export type UpdateServiceDefinitionBody = z.infer<
  typeof UpdateServiceDefinitionSchema
>;
export type ServiceDefinitionIdParams = z.infer<
  typeof ServiceDefinitionIdParam
>;
