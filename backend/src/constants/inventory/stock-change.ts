import type { FieldMapping } from "@/shared/pagination-utils";

/**
 * Field mapping for StockChange entity queries
 */
export const STOCK_CHANGE_FIELD_MAPPING: FieldMapping = {
  quantity: { column: "change.quantity", type: "number" },
  type: { column: "change.type", type: "string" },
  createdAt: { column: "change.createdAt", type: "date" },
  updatedAt: { column: "change.updatedAt", type: "date" },
};
