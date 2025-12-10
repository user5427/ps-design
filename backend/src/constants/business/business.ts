import type { FieldMapping } from "@/shared/pagination-utils";

/**
 * Field mapping for Business entity queries
 * Maps frontend field names to database columns with type information
 */
export const BUSINESS_FIELD_MAPPING: FieldMapping = {
  name: { column: "business.name", type: "string" },
  createdAt: { column: "business.createdAt", type: "date" },
  updatedAt: { column: "business.updatedAt", type: "date" },
};
