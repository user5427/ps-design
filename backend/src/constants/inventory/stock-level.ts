import type { FieldMapping } from "@/shared/pagination-utils";

/**
 * Field mapping for StockLevel entity queries
 */
export const STOCK_LEVEL_FIELD_MAPPING: FieldMapping = {
  quantity: { column: "level.quantity", type: "number" },
  updatedAt: { column: "level.updatedAt", type: "date" },
};
