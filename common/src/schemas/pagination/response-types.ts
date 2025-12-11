import { z } from "zod";

/**
 * Pagination metadata returned in paginated responses
 * Used by both backend and frontend to understand pagination state
 */
export const PaginationMetadataSchema = z.object({
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  pages: z.number().int().min(0),
});

export type PaginationMetadata = z.infer<typeof PaginationMetadataSchema>;

/**
 * Generic paginated response wrapper used across backend and frontend
 * Type-safe representation of any paginated list response
 */
export type PaginatedResult<T> = {
  items: T[];
  metadata: PaginationMetadata;
};

/**
 * Generic paginated response schema builder
 *
 * Usage examples:
 * ```typescript
 * // Simple usage with just a schema
 * const UserPaginatedSchema = createPaginatedSchema(UserResponseSchema);
 *
 * // With custom schema name for better documentation
 * const BusinessPaginatedSchema = createPaginatedSchema(
 *   BusinessResponseSchema,
 *   "PaginatedBusinessResponse"
 * );
 * ```
 */
export function createPaginatedSchema<T extends z.ZodTypeAny>(
  itemSchema: T,
  schemaName?: string,
) {
  const schema = z.object({
    items: z.array(itemSchema),
    metadata: PaginationMetadataSchema,
  });

  // Set schema description if name provided for better documentation
  if (schemaName) {
    return schema.describe(schemaName);
  }

  return schema;
}

/**
 * Infer the paginated response type from a response schema
 *
 * Usage:
 * ```typescript
 * type PaginatedBusiness = PaginatedType<typeof BusinessResponseSchema>;
 * ```
 */
export type PaginatedType<T extends z.ZodTypeAny> = {
  items: z.infer<T>[];
  metadata: PaginationMetadata;
};
