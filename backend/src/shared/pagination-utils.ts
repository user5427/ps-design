import type { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import {
  FilterOperator,
  SortDirection,
  type UniversalPaginationQuery,
  type PaginationMetadata,
} from "@ps-design/schemas/shared";

/**
 * Applies pagination to a TypeORM query builder
 */
export function applyPagination<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  page: number,
  limit: number,
): SelectQueryBuilder<T> {
  const skip = (page - 1) * limit;
  return query.skip(skip).take(limit);
}

/**
 * Interface for field mapping for filtering and sorting
 * Maps frontend field names to database column names
 */
export interface FieldMapping {
  [fieldName: string]: {
    column: string; // Database column name (e.g., "business.name")
    type?: "string" | "number" | "date" | "boolean"; // Optional type info for type-safe operations
  };
}

/**
 * Apply filters to a query builder based on filter conditions
 * @param query - The TypeORM query builder
 * @param filters - Array of filter conditions
 * @param fieldMapping - Mapping of field names to database columns
 * @param parameterPrefix - Prefix for parameters to avoid conflicts
 */
export function applyFilters<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  filters: Array<{
    fieldName: string;
    operator: FilterOperator;
    value: unknown;
  }> | undefined,
  fieldMapping: FieldMapping,
  parameterPrefix: string = "filter",
): SelectQueryBuilder<T> {
  if (!filters || filters.length === 0) {
    return query;
  }

  filters.forEach((filter, index) => {
    const mapping = fieldMapping[filter.fieldName];
    if (!mapping) {
      console.warn(`Field mapping not found for: ${filter.fieldName}`);
      return;
    }

    const column = mapping.column;
    const paramName = `${parameterPrefix}_${index}`;

    switch (filter.operator) {
      case FilterOperator.EQ:
        query = query.andWhere(`${column} = :${paramName}`, {
          [paramName]: filter.value,
        });
        break;

      case FilterOperator.NEQ:
        query = query.andWhere(`${column} != :${paramName}`, {
          [paramName]: filter.value,
        });
        break;

      case FilterOperator.LT:
        query = query.andWhere(`${column} < :${paramName}`, {
          [paramName]: filter.value,
        });
        break;

      case FilterOperator.LTE:
        query = query.andWhere(`${column} <= :${paramName}`, {
          [paramName]: filter.value,
        });
        break;

      case FilterOperator.GT:
        query = query.andWhere(`${column} > :${paramName}`, {
          [paramName]: filter.value,
        });
        break;

      case FilterOperator.GTE:
        query = query.andWhere(`${column} >= :${paramName}`, {
          [paramName]: filter.value,
        });
        break;

      case FilterOperator.IN:
        if (Array.isArray(filter.value)) {
          query = query.andWhere(`${column} IN (:...${paramName})`, {
            [paramName]: filter.value,
          });
        }
        break;

      case FilterOperator.NIN:
        if (Array.isArray(filter.value)) {
          query = query.andWhere(`${column} NOT IN (:...${paramName})`, {
            [paramName]: filter.value,
          });
        }
        break;

      case FilterOperator.LIKE:
        query = query.andWhere(`${column} ILIKE :${paramName}`, {
          [paramName]: `%${filter.value}%`,
        });
        break;

      case FilterOperator.ILIKE:
        query = query.andWhere(`${column} ILIKE :${paramName}`, {
          [paramName]: `%${filter.value}%`,
        });
        break;

      case FilterOperator.BETWEEN:
        if (Array.isArray(filter.value) && filter.value.length === 2) {
          query = query.andWhere(
            `${column} BETWEEN :${paramName}_min AND :${paramName}_max`,
            {
              [`${paramName}_min`]: filter.value[0],
              [`${paramName}_max`]: filter.value[1],
            },
          );
        }
        break;

      case FilterOperator.EXISTS:
        if (filter.value === true) {
          query = query.andWhere(`${column} IS NOT NULL`);
        } else {
          query = query.andWhere(`${column} IS NULL`);
        }
        break;

      default:
        console.warn(`Unknown filter operator: ${filter.operator}`);
    }
  });

  return query;
}

/**
 * Apply sorting to a query builder
 */
export function applySorting<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  sort: { fieldName: string; direction: SortDirection } | undefined,
  fieldMapping: FieldMapping,
): SelectQueryBuilder<T> {
  if (!sort) {
    return query;
  }

  const mapping = fieldMapping[sort.fieldName];
  if (!mapping) {
    console.warn(`Field mapping not found for sorting: ${sort.fieldName}`);
    return query;
  }

  const column = mapping.column;
  const direction =
    sort.direction === SortDirection.DESC ? "DESC" : "ASC";

  return query.orderBy(column, direction);
}

/**
 * Select specific columns from the result
 * If columns array is empty or undefined, all columns are returned
 */
export function selectColumns<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  columns: string[] | undefined,
  baseAlias: string,
): SelectQueryBuilder<T> {
  if (!columns || columns.length === 0) {
    return query;
  }

  // Map column names to full qualified names
  const qualifiedColumns = columns.map((col) => `${baseAlias}.${col}`);
  return query.select(qualifiedColumns);
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMetadata(
  total: number,
  page: number,
  limit: number,
): PaginationMetadata {
  const pages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    pages,
  };
}

/**
 * Complete pagination handler for a query builder
 * Applies all pagination, filtering, sorting, and column selection
 */
export async function executePaginatedQuery<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  paginationQuery: UniversalPaginationQuery,
  fieldMapping: FieldMapping,
  baseAlias: string,
): Promise<{
  items: T[];
  metadata: PaginationMetadata;
}> {
  // Clone the query for counting total records (before pagination)
  const countQuery = query.clone();

  // Apply filters to both queries
  if (paginationQuery.filters) {
    applyFilters(
      query as SelectQueryBuilder<ObjectLiteral>,
      paginationQuery.filters,
      fieldMapping,
      "filter",
    );
    applyFilters(
      countQuery as SelectQueryBuilder<ObjectLiteral>,
      paginationQuery.filters,
      fieldMapping,
      "filter",
    );
  }

  // Apply sorting
  if (paginationQuery.sort) {
    applySorting(
      query as SelectQueryBuilder<ObjectLiteral>,
      paginationQuery.sort,
      fieldMapping,
    );
  }

  // Get total count before pagination
  const total = await countQuery.getCount();

  // Apply pagination
  applyPagination(
    query as SelectQueryBuilder<ObjectLiteral>,
    paginationQuery.page,
    paginationQuery.limit,
  );

  // Select specific columns if requested
  if (paginationQuery.columns && paginationQuery.columns.length > 0) {
    selectColumns(
      query as SelectQueryBuilder<ObjectLiteral>,
      paginationQuery.columns,
      baseAlias,
    );
  }

  // Execute the query
  const items = await query.getMany();

  // Calculate metadata
  const metadata = calculatePaginationMetadata(
    total,
    paginationQuery.page,
    paginationQuery.limit,
  );

  return { items, metadata };
}
