import type {
  UniversalPaginationQuery,
  PaginatedResult,
} from "@ps-design/schemas/pagination";
import type { EntityMapping } from "@ps-design/utils";
import { apiClient } from "@/api/client";

/**
 * Pagination API Client
 * Handles dynamic API calls based on entity mapping configuration
 * Automatically constructs requests with filters, sorting, search, column selection, etc.
 */

export class PaginationClient {
  /**
   * Fetches paginated data from the backend
   * Constructs the complete URL with query parameters from UniversalPaginationQuery
   *
   * @param mapping - Entity mapping that defines the endpoint and field configuration
   * @param query - Pagination query containing filters, sorting, search, pagination, and column selection
   * @returns Promise with paginated result containing items and metadata
   */
  async fetchPaginated<T extends Record<string, unknown>>(
    mapping: EntityMapping,
    query: UniversalPaginationQuery,
  ): Promise<PaginatedResult<T>> {
    const url = this.buildUrl(mapping.endpoint, query);

    const response = await apiClient.get(url);

    return response.data as PaginatedResult<T>;
  }

  /**
   * Builds complete URL with query parameters from UniversalPaginationQuery
   * Handles:
   * - Pagination (page, limit)
   * - Sorting (sort.fieldName, sort.direction)
   * - Filtering (filters[].fieldName, filters[].operator, filters[].value)
   * - Column selection (columns[])
   * - Global search (search)
   *
   * @param endpoint - Base endpoint from mapping
   * @param query - Complete pagination query object
   * @returns Complete URL with query string
   */
  private buildUrl(
    endpoint: string,
    query: UniversalPaginationQuery,
  ): string {
    const params = new URLSearchParams();

    // Add pagination parameters
    if (query.page !== undefined) {
      params.append("page", String(query.page));
    }
    if (query.limit !== undefined) {
      params.append("limit", String(query.limit));
    }

    // Add search parameter
    if (query.search) {
      params.append("search", query.search);
    }

    // Add sorting parameters
    if (query.sort) {
      params.append("sort.fieldName", query.sort.fieldName);
      params.append("sort.direction", query.sort.direction);
    }

    // Add filter parameters
    if (query.filters && query.filters.length > 0) {
      query.filters.forEach((filter, index) => {
        params.append(`filters[${index}].fieldName`, filter.fieldName);
        params.append(`filters[${index}].operator`, filter.operator);

        // Handle different value types
        if (Array.isArray(filter.value)) {
          filter.value.forEach((val, valIndex) => {
            params.append(`filters[${index}].value[${valIndex}]`, String(val));
          });
        } else if (filter.value !== null && filter.value !== undefined) {
          params.append(`filters[${index}].value`, String(filter.value));
        }
      });
    }

    // Add column selection parameters
    if (query.columns && query.columns.length > 0) {
      query.columns.forEach((col) => {
        params.append("columns[]", col);
      });
    }

    const queryString = params.toString();

    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }
}

/**
 * Singleton instance of PaginationClient
 * Provides a centralized way to make pagination API calls
 */
export const paginationClient = new PaginationClient();
