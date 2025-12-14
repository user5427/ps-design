import { z } from "zod";
import { uuid } from "../shared/zod-utils";

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;

export const TaxIdParam = z.object({
  taxId: uuid(),
});

export const CreateTaxSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH)
    .max(MAX_NAME_LENGTH),
  rate: z
    .number()
    .min(0)
    .max(100), // percentage
  description: z.string().nullable().optional(),
});

export const UpdateTaxSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH)
    .max(MAX_NAME_LENGTH)
    .optional(),
  rate: z
    .number()
    .min(0)
    .max(100)
    .optional(),
  description: z.string().nullable().optional(),
});

export type CreateTaxBody = z.infer<typeof CreateTaxSchema>;
export type UpdateTaxBody = z.infer<typeof UpdateTaxSchema>;
export type TaxIdParams = z.infer<typeof TaxIdParam>;
