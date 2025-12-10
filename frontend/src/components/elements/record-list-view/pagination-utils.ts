import type {
  UniversalPaginationQuery,
  FrontendPaginationState,
} from "@ps-design/schemas/pagination";

/**
 * Convert FrontendPaginationState to UniversalPaginationQuery for API calls
 */
export function paginationStateToPaginationQuery(
  state: FrontendPaginationState,
): UniversalPaginationQuery {
  return {
    page: state.page,
    limit: state.limit,
    search: state.search,
    filters: state.filters && state.filters.length > 0 ? state.filters : undefined,
    sort: state.sort,
    columns: state.selectedColumns && state.selectedColumns.length > 0
      ? state.selectedColumns
      : undefined,
  };
}

/**
 * Add or update a filter in FrontendPaginationState
 */
export function updateFilter(
  state: FrontendPaginationState,
  fieldName: string,
  operator: string,
  value: unknown,
): FrontendPaginationState {
  const filters = [...state.filters];
  const index = filters.findIndex((f) => f.fieldName === fieldName);

  if (index >= 0) {
    filters[index] = { fieldName, operator: operator as any, value };
  } else {
    filters.push({ fieldName, operator: operator as any, value });
  }

  return { ...state, filters };
}

/**
 * Remove a filter from FrontendPaginationState
 */
export function removeFilter(
  state: FrontendPaginationState,
  fieldName: string,
): FrontendPaginationState {
  return {
    ...state,
    filters: state.filters.filter((f) => f.fieldName !== fieldName),
  };
}

/**
 * Clear all filters from FrontendPaginationState
 */
export function clearFilters(state: FrontendPaginationState): FrontendPaginationState {
  return { ...state, filters: [] };
}
