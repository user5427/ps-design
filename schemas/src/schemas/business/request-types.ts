import { z } from "zod";
import { uuid } from "../shared/zod-utils";
import { UniversalPaginationQuerySchema } from "../pagination";

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;

const MIN_NAME_MESSAGE = `Name must be at least ${MIN_NAME_LENGTH} characters`;
const MAX_NAME_MESSAGE = `Name must be at most ${MAX_NAME_LENGTH} characters`;

export const BusinessIdParam = z.object({ businessId: uuid() });

export const CreateBusinessSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE),
});

export const UpdateBusinessSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE)
    .optional(),
});

export const BusinessQuerySchema = UniversalPaginationQuerySchema;

export type CreateBusinessBody = z.infer<typeof CreateBusinessSchema>;
export type UpdateBusinessBody = z.infer<typeof UpdateBusinessSchema>;
export type BusinessIdParams = z.infer<typeof BusinessIdParam>;
export type BusinessQuery = z.infer<typeof BusinessQuerySchema>;
