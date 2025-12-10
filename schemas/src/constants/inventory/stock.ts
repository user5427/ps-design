import { createEntityMapping } from "../../utils/field-mapping-builder";
import {
  StockLevelResponseSchema,
  StockChangeResponseSchema,
} from "../../schemas/inventory/stock";

/**
 * Complete mapping for Stock Level entity including fields, display names, and API endpoint
 */
export const STOCK_LEVEL_MAPPING = createEntityMapping(
  StockLevelResponseSchema,
  {
    productName: { column: "product.name", type: "string", displayName: "Product" },
    totalQuantity: { column: "level.quantity", type: "number", displayName: "Quantity" },
    isDisabled: { column: "product.isDisabled", type: "boolean", displayName: "Disabled" },
  },
  ["productId", "productUnit"],
  "/api/inventory/stock-levels",
  "Stock Level"
);

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
  "/api/inventory/stock-changes",
  "Stock Change"
);