import { z } from "zod";
import { uuid } from "../shared/zod-utils";
import { PaginationMetaSchema } from "../shared/response-types";

export const BusinessResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  isDefault: z.boolean(),
});

export const PaginatedBusinessResponseSchema = z.object({
  items: z.array(BusinessResponseSchema),
  ...PaginationMetaSchema.shape,
});

export type BusinessResponse = z.infer<typeof BusinessResponseSchema>;
export type PaginatedBusinessResponse = z.infer<
  typeof PaginatedBusinessResponseSchema
>;
