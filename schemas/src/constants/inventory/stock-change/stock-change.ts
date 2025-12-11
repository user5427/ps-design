import { createEntityMapping } from "../../../utils/field-mapping-builder";
import {
  StockChangeResponseSchema,
} from "../../../schemas/inventory/stock-change";

/**
 * Complete mapping for Stock Change entity including fields, display names, and API endpoint
 */
export const STOCK_CHANGE_MAPPING = createEntityMapping(
  StockChangeResponseSchema,
  {
    quantity: { column: "change.quantity", type: "number", displayName: "Quantity" },
    type: { column: "change.type", type: "string", displayName: "Type" },
    createdAt: { column: "change.createdAt", type: "date", displayName: "Created" },
    updatedAt: { column: "change.updatedAt", type: "date", displayName: "Updated" },
  },
  ["id", "productId", "businessId", "expirationDate", "createdByUserId", "deletedAt", "product"],
  "/inventory/stock-changes",
  "Stock Change"
);
