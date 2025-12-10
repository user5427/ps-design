import { createFieldMapping } from "../../utils/field-mapping-builder";
import {
  StockLevelResponseSchema,
  StockChangeResponseSchema,
} from "../../schemas/inventory/stock";

/**
 * Field mapping for Stock Level entity queries
 * TypeScript will warn if you don't map all fields or exclude them
 */
export const STOCK_LEVEL_FIELD_MAPPING = createFieldMapping(
  StockLevelResponseSchema,
  {
    productName: { column: "product.name", type: "string" },
    totalQuantity: { column: "level.quantity", type: "number" },
    isDisabled: { column: "product.isDisabled", type: "boolean" },
  },
  ["productId", "productUnit"]
);

/**
 * Field mapping for Stock Change entity queries
 * TypeScript will warn if you don't map all fields or exclude them
 */
export const STOCK_CHANGE_FIELD_MAPPING = createFieldMapping(
  StockChangeResponseSchema,
  {
    quantity: { column: "change.quantity", type: "number" },
    type: { column: "change.type", type: "string" },
    createdAt: { column: "change.createdAt", type: "date" },
    updatedAt: { column: "change.updatedAt", type: "date" },
  },
  ["id", "productId", "businessId", "expirationDate", "createdByUserId", "deletedAt", "product"]
);