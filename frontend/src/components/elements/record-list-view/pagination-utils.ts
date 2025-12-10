import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";

/**
 * Add or update a filter in UniversalPaginationQuery
 */
export function updateFilter(
  state: UniversalPaginationQuery,
  fieldName: string,
  operator: string,
  value: unknown,
): UniversalPaginationQuery {
  const filters = [...(state.filters || [])];
  const index = filters.findIndex((f) => f.fieldName === fieldName);

  if (index >= 0) {
    filters[index] = { fieldName, operator: operator as any, value };
  } else {
    filters.push({ fieldName, operator: operator as any, value });
  }

  return { ...state, filters };
}

/**
 * Remove a filter from UniversalPaginationQuery
 */
export function removeFilter(
  state: UniversalPaginationQuery,
  fieldName: string,
): UniversalPaginationQuery {
  return {
    ...state,
    filters: state.filters?.filter((f) => f.fieldName !== fieldName),
  };
}

/**
 * Clear all filters from UniversalPaginationQuery
 */
export function clearFilters(state: UniversalPaginationQuery): UniversalPaginationQuery {
  return { ...state, filters: [] };
}
