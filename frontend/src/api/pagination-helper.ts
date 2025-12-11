import { apiClient } from "@/api/client";
import type { EntityMapping } from "@ps-design/utils";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";

/**
 * Generic pagination API helper that works with any entity mapping
 * Handles building the query string and fetching paginated data
 */
export class PaginationHelper {
  constructor(private mapping: EntityMapping) {}

  /**
   * Fetch paginated data from the API
   */
  async fetchPaginated(query: UniversalPaginationQuery): Promise<{
    items: Record<string, unknown>[];
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

      return {
        items: response.data.items,
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
export function createPaginationHelper(mapping: EntityMapping) {
  return new PaginationHelper(mapping);
}
