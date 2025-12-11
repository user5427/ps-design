import { z } from "zod";
import { uuid } from "../../shared/zod-utils";

const MIN_PRICE = 0;
const MIN_DURATION = 1; // At least 1 minute
const MAX_DURATION = 480; // Max 8 hours

const MIN_PRICE_MESSAGE = `Price must be at least ${MIN_PRICE}`;
const MIN_DURATION_MESSAGE = `Duration must be at least ${MIN_DURATION} minute`;
const MAX_DURATION_MESSAGE = `Duration must be at most ${MAX_DURATION} minutes`;

export const ServiceIdParam = z.object({ serviceId: uuid() });

export const CreateServiceSchema = z.object({
  employeeId: uuid(),
  serviceDefinitionId: uuid(),
  price: z.number().min(MIN_PRICE, MIN_PRICE_MESSAGE),
  baseDuration: z
    .number()
    .int()
    .min(MIN_DURATION, MIN_DURATION_MESSAGE)
    .max(MAX_DURATION, MAX_DURATION_MESSAGE),
  isDisabled: z.boolean().default(false),
});

export const UpdateServiceSchema = z.object({
  price: z.number().min(MIN_PRICE, MIN_PRICE_MESSAGE).optional(),
  baseDuration: z
    .number()
    .int()
    .min(MIN_DURATION, MIN_DURATION_MESSAGE)
    .max(MAX_DURATION, MAX_DURATION_MESSAGE)
    .optional(),
  isDisabled: z.boolean().optional(),
});

export type CreateServiceBody = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceBody = z.infer<typeof UpdateServiceSchema>;
export type ServiceIdParams = z.infer<typeof ServiceIdParam>;
