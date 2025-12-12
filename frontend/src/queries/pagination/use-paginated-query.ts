import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";
import { SortDirection } from "@ps-design/schemas/pagination";
import type { EntityMapping } from "@ps-design/utils";
import { paginationClient } from "@/api/pagination";

/**
 * Hook for handling paginated data fetching with full query support
 *
 * Features:
 * - Automatic data fetching based on mapping endpoint
 * - Filter, sort, search, column selection, and pagination all supported
 * - Separates internal query state from external control (optional)
 * - Automatically validates response data
 *
 * @param mapping - Entity mapping that defines endpoint and field configuration
 * @param initialQuery - Optional initial query state (defaults to page 1, limit 20)
 * @returns Object with data, metadata, loading state, error, and query management functions
 *
 * @example
 * ```tsx
 * const { items, metadata, isLoading, error, query, setQuery } = usePaginatedQuery(PRODUCT_MAPPING);
 *
 * // Update query
 * setQuery({ page: 2, limit: 50, search: "widget" });
 * ```
 */
export function usePaginatedQuery<
  T extends Record<string, unknown> = Record<string, unknown>,
>(mapping: EntityMapping, initialQuery?: UniversalPaginationQuery) {
  // Default query: page 1, limit 20, no filters
  const defaultQuery: UniversalPaginationQuery = useMemo(
    () => ({
      page: 1,
      limit: 20,
      ...initialQuery,
    }),
    [initialQuery],
  );

  const [query, setQuery] = useState<UniversalPaginationQuery>(defaultQuery);

  // Fetch data using React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "paginated",
      mapping.endpoint,
      JSON.stringify(query), // Include query in key for automatic refetch on change
    ],
    queryFn: async () => {
      const result = await paginationClient.fetchPaginated<T>(mapping, query);
      return result;
    },
    retry: 1,
    staleTime: 0, // Data is always stale to ensure fresh data on page changes
    gcTime: 5 * 60 * 1000, // Keep cache for 5 minutes before garbage collection
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  /**
   * Update pagination query and trigger refetch
   * Can be used to:
   * - Change page: setQuery({ ...query, page: 2 })
   * - Add filters: setQuery({ ...query, filters: [...] })
   * - Change search: setQuery({ ...query, search: "term" })
   * - Update sorting: setQuery({ ...query, sort: { fieldName: "name", direction: "asc" } })
   * - Select columns: setQuery({ ...query, columns: ["id", "name"] })
   */
  const updateQuery = useCallback((newQuery: UniversalPaginationQuery) => {
    setQuery(newQuery);
    // React Query will automatically refetch due to queryKey change
  }, []);

  /**
   * Reset query to initial state
   */
  const resetQuery = useCallback(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  /**
   * Helper to add or update a filter
   */
  const addFilter = useCallback(
    (fieldName: string, operator: string, value: unknown) => {
      const filters = [...(query.filters || [])];
      const index = filters.findIndex((f) => f.fieldName === fieldName);

      if (index >= 0) {
        filters[index] = { fieldName, operator: operator as any, value };
      } else {
        filters.push({ fieldName, operator: operator as any, value });
      }

      setQuery({ ...query, filters, page: 1 }); // Reset to page 1 when filtering
    },
    [query],
  );

  /**
   * Helper to remove a filter
   */
  const removeFilter = useCallback(
    (fieldName: string) => {
      const filters = (query.filters || []).filter(
        (f) => f.fieldName !== fieldName,
      );
      setQuery({ ...query, filters, page: 1 });
    },
    [query],
  );

  /**
   * Helper to clear all filters
   */
  const clearFilters = useCallback(() => {
    setQuery({ ...query, filters: [], page: 1 });
  }, [query]);

  /**
   * Helper to set sorting
   */
  const setSort = useCallback(
    (fieldName: string, direction: SortDirection = SortDirection.ASC) => {
      setQuery({
        ...query,
        sort: { fieldName, direction },
        page: 1,
      });
    },
    [query],
  );

  /**
   * Helper to set search term
   */
  const setSearch = useCallback(
    (searchTerm: string) => {
      setQuery({
        ...query,
        search: searchTerm || undefined,
        page: 1, // Reset to page 1 when searching
      });
    },
    [query],
  );

  /**
   * Helper to set pagination
   */
  const setPagination = useCallback(
    (page: number, limit?: number) => {
      setQuery({
        ...query,
        page,
        limit: limit ?? query.limit,
      });
    },
    [query],
  );

  /**
   * Helper to select specific columns
   */
  const selectColumns = useCallback(
    (columns: string[]) => {
      setQuery({
        ...query,
        columns: columns.length > 0 ? columns : undefined,
      });
    },
    [query],
  );

  return {
    // Data and state
    items: (data?.items ?? []) as T[],
    metadata: data?.metadata,
    isLoading,
    error: error as Error | null,
    data, // Raw data for advanced usage

    // Query management
    query,
    setQuery: updateQuery,
    resetQuery,

    // Convenience helpers
    addFilter,
    removeFilter,
    clearFilters,
    setSort,
    setSearch,
    setPagination,
    selectColumns,

    // Manual refetch
    refetch,
  };
}
