import { EntityMapping } from "../../../utils/field-mapping-builder";

/**
 * Complete mapping for Stock Change entity including fields, display names, and API endpoint
 */
export const STOCK_CHANGE_MAPPING: EntityMapping = {
  fields: {
    quantity: { column: "change.quantity", type: "number", displayName: "Quantity" },
    type: { column: "change.type", type: "string", displayName: "Type" },
    createdAt: { column: "change.createdAt", type: "date", displayName: "Created" },
    updatedAt: { column: "change.updatedAt", type: "date", displayName: "Updated" },
  },
  endpoint: "/inventory/stock-change",
  displayName: "Stock Change"
};