import { z } from "zod";

/**
 * Filter operator types for flexible querying
 */
export enum FilterOperator {
  EQ = "eq", // Equal
  NEQ = "neq", // Not equal
  LT = "lt", // Less than
  LTE = "lte", // Less than or equal
  GT = "gt", // Greater than
  GTE = "gte", // Greater than or equal
  IN = "in", // In array
  NIN = "nin", // Not in array
  LIKE = "like", // Contains (case-insensitive)
  ILIKE = "ilike", // Contains (case-insensitive, database specific)
  BETWEEN = "between", // Between two values
  EXISTS = "exists", // Field exists (true/false)
}

/**
 * Sort direction for ordering
 */
export enum SortDirection {
  ASC = "asc",
  DESC = "desc",
}

/**
 * Single filter condition
 */
export const FilterConditionSchema = z.object({
  fieldName: z.string().min(1, "Field name is required"),
  operator: z.nativeEnum(FilterOperator),
  value: z.unknown(), // Can be any value depending on operator
});

export type FilterCondition = z.infer<typeof FilterConditionSchema>;

/**
 * Sort specification for a single column
 */
export const SortSpecSchema = z.object({
  fieldName: z.string().min(1, "Field name is required"),
  direction: z.nativeEnum(SortDirection).default(SortDirection.ASC),
});

export type SortSpec = z.infer<typeof SortSpecSchema>;

/**
 * Column selection specification
 */
export const ColumnSelectionSchema = z.object({
  columns: z.array(z.string()).optional(), // If empty/undefined, return all columns
});

export type ColumnSelection = z.infer<typeof ColumnSelectionSchema>;

/**
 * Universal pagination query schema
 * Used by backend to validate incoming request parameters
 * Used by frontend to structure query parameters before sending requests
 * 
 * This schema captures all pagination, filtering, sorting, and column selection needs
 */
export const UniversalPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(), // Generic search field (usually searches all text fields)
  filters: z.array(FilterConditionSchema).optional(), // Advanced filters
  sort: SortSpecSchema.optional(), // Single column sort
  columns: z.array(z.string()).optional(), // Column selection (empty = all)
});

export type UniversalPaginationQuery = z.infer<
  typeof UniversalPaginationQuerySchema
>;
