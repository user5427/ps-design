import { createEntityMapping } from "../../../utils/field-mapping-builder";

/**
 * Complete mapping for Stock Level entity including fields, display names, and API endpoint
 */
export const STOCK_LEVEL_MAPPING = createEntityMapping(
  {
    productName: { column: "product.name", type: "string", displayName: "Product" },
    totalQuantity: { column: "level.quantity", type: "number", displayName: "Quantity" },
    isDisabled: { column: "product.isDisabled", type: "boolean", displayName: "Disabled" },
  },
  "/inventory/stock-level",
  "Stock Level"
);
