import { z } from "zod";
import { uuid } from "../shared/zod-utils";
import { PaginationMetaSchema } from "../shared/response-types";
import { createPaginatedSchema } from "../pagination";

export const BusinessResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  isDefault: z.boolean(),
  isOrderBased: z.boolean(),
  isAppointmentBased: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const AdvancedPaginatedBusinessResponseSchema = createPaginatedSchema(
  BusinessResponseSchema,
  "PaginatedBusinessResponse",
);


export const PaginatedBusinessResponseSchema = z.object({
  items: z.array(BusinessResponseSchema),
  ...PaginationMetaSchema.shape,
});

export type BusinessResponse = z.infer<typeof BusinessResponseSchema>;
export type PaginatedBusinessResponse = z.infer<
  typeof PaginatedBusinessResponseSchema
>;
export type AdvancedPaginatedBusinessResponse = z.infer<
  typeof AdvancedPaginatedBusinessResponseSchema
>;
