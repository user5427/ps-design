import { createEntityMapping } from "../../../utils/field-mapping-builder";
import { ProductResponseSchema } from "../../../schemas/inventory/product";

/**
 * Complete mapping for Product entity including fields, display names, and API endpoint
 */
export const PRODUCT_MAPPING = createEntityMapping(
  ProductResponseSchema,
  {
    name: { column: "product.name", type: "string", displayName: "Product Name" },
    description: { column: "product.description", type: "string", displayName: "Description" },
    isDisabled: { column: "product.isDisabled", type: "boolean", displayName: "Disabled" },
    createdAt: { column: "product.createdAt", type: "date", displayName: "Created" },
    updatedAt: { column: "product.updatedAt", type: "date", displayName: "Updated" },
  },
  ["id", "productUnitId", "businessId", "deletedAt", "productUnit"],
  "/inventory/products",
  "Product"
);
