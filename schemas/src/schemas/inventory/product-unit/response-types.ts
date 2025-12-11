import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";
import { createPaginatedSchema, type PaginatedType } from "../../pagination";

export const ProductUnitResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  symbol: z.string().nullable(),
  businessId: uuid(),
  createdAt: datetime(),
  updatedAt: datetime(),
  deletedAt: datetime().nullable(),
});

/**
 * Paginated product unit list response
 */
export const PaginatedProductUnitResponseSchema = createPaginatedSchema(
  ProductUnitResponseSchema,
  "PaginatedProductUnitResponse",
);

export type ProductUnitResponse = z.infer<typeof ProductUnitResponseSchema>;
export type PaginatedProductUnitResponse = PaginatedType<
  typeof ProductUnitResponseSchema
>;
