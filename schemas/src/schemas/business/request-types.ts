import { z } from "zod";
import { PaginationSchema } from "../shared/request-types";
import { uuid } from "../shared/zod-utils";

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
  email: z.string().email("Invalid email address").optional(),
  phone: z
    .string()
    .regex(/^[\d\s()+-]+$/, "Phone number can only contain digits, spaces, and +()-")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
});

export const UpdateBusinessSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE)
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z
    .string()
    .regex(/^[\d\s()+-]+$/, "Phone number can only contain digits, spaces, and +()-")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
});

export const BusinessQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
});

export type CreateBusinessBody = z.infer<typeof CreateBusinessSchema>;
export type UpdateBusinessBody = z.infer<typeof UpdateBusinessSchema>;
export type BusinessIdParams = z.infer<typeof BusinessIdParam>;
export type BusinessQuery = z.infer<typeof BusinessQuerySchema>;
