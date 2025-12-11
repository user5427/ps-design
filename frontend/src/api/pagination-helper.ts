import { apiClient } from "@/api/client";
import type { EntityMapping } from "@ps-design/utils";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";
import { z } from "zod";

/**
 * Generic pagination API helper that works with any entity mapping
 * Handles building the query string and fetching paginated data
 */
export class PaginationHelper<T extends z.ZodObject<any>> {
  constructor(private mapping: EntityMapping<T>) {}

  /**
   * Fetch paginated data from the API
   * Automatically validates response against the schema
   */
  async fetchPaginated(query: UniversalPaginationQuery): Promise<{
    items: z.infer<T>[];
    metadata: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await apiClient.get<any>(this.mapping.endpoint, {
        params: {
          page: query.page,
          limit: query.limit,
          search: query.search,
          filters: query.filters,
          sort: query.sort,
          columns: query.columns,
        },
      });

      // Validate each item against the schema
      const validatedItems = response.data.items.map((item: unknown) => {
        const result = this.mapping.schema.safeParse(item);
        if (!result.success) {
          console.warn(
            `Failed to validate item in pagination response:`,
            result.error
          );
          return null;
        }
        return result.data;
      });

      // Filter out any items that failed validation
      const items = validatedItems.filter(
        (item: z.infer<T> | null): item is z.infer<T> => item !== null
      );

      return {
        items,
        metadata: response.data.metadata,
      };
    } catch (error) {
      console.error("Pagination fetch failed:", error);
      throw new Error(
        `Failed to fetch ${this.mapping.displayName} data: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

/**
 * Create a pagination helper for a specific entity mapping
 */
export function createPaginationHelper<T extends z.ZodObject<any>>(
  mapping: EntityMapping<T>
) {
  return new PaginationHelper(mapping);
}
