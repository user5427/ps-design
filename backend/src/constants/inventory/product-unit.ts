import type { FieldMapping } from "@/shared/pagination-utils";

/**
 * Field mapping for ProductUnit entity queries
 */
export const PRODUCT_UNIT_FIELD_MAPPING: FieldMapping = {
  name: { column: "unit.name", type: "string" },
  symbol: { column: "unit.symbol", type: "string" },
  createdAt: { column: "unit.createdAt", type: "date" },
  updatedAt: { column: "unit.updatedAt", type: "date" },
};
