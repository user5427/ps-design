import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { EntityMapping } from "@ps-design/utils";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";
import { PaginationHelper } from "@/api/pagination-helper";
import { useState } from "react";

/**
 * Generic pagination query hook for any entity
 * Manages fetching paginated data with filtering, sorting, etc.
 * Does NOT handle mutations - those are passed as callbacks to UI components
 */
export function usePaginatedQuery(mapping: EntityMapping) {
  const [query, setQuery] = useState<UniversalPaginationQuery>({
    page: 1,
    limit: 20,
  });

  const helper = new PaginationHelper(mapping);
  const queryClient = useQueryClient();

  // Query key based on mapping endpoint and current query
  const queryKey = [mapping.endpoint, query];

  const {
    data,
    isLoading,
    error,
    isPending,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      return helper.fetchPaginated(query);
    },
  });

  return {
    // Data
    items: data?.items ?? [],
    metadata: data?.metadata,

    // Loading states
    isLoading: isLoading || isPending,
    error: error ? new Error(error.message) : null,

    // Query management
    query,
    setQuery,

    // Helper methods for common query updates
    setPage: (page: number) =>
      setQuery((q) => ({ ...q, page })),
    setLimit: (limit: number) =>
      setQuery((q) => ({ ...q, page: 1, limit })),
    setSearch: (search: string | undefined) =>
      setQuery((q) => ({ ...q, search, page: 1 })),
    setFilters: (filters: UniversalPaginationQuery["filters"]) =>
      setQuery((q) => ({ ...q, filters, page: 1 })),
    setSort: (sort: UniversalPaginationQuery["sort"]) =>
      setQuery((q) => ({ ...q, sort, page: 1 })),

    // Invalidate to refetch
    refetch: () =>
      queryClient.invalidateQueries({ queryKey }),
  };
}
