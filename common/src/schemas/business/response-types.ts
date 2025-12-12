import { z } from "zod";
import { uuid } from "../shared/zod-utils";
import { createPaginatedSchema, type PaginatedType } from "../pagination";

export const BusinessResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
});

/**
 * Paginated business list response
 * Frontend uses this to validate incoming responses from API
 * Automatically creates: { items: Business[], metadata: {...} }
 */
export const PaginatedBusinessResponseSchema = createPaginatedSchema(
  BusinessResponseSchema,
  "PaginatedBusinessResponse",
);

export type BusinessResponse = z.infer<typeof BusinessResponseSchema>;
export type PaginatedBusinessResponse = PaginatedType<
  typeof BusinessResponseSchema
>;
