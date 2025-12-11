import { createEntityMapping } from "../../../utils/field-mapping-builder";

/**
 * Complete mapping for Product entity including fields, display names, and API endpoint
 */
export const PRODUCT_MAPPING = createEntityMapping(
  {
    name: { column: "product.name", type: "string", displayName: "Product Name" },
    description: { column: "product.description", type: "string", displayName: "Description" },
    isDisabled: { column: "product.isDisabled", type: "boolean", displayName: "Disabled" },
    createdAt: { column: "product.createdAt", type: "date", displayName: "Created" },
    updatedAt: { column: "product.updatedAt", type: "date", displayName: "Updated" },
  },
  "/inventory/product",
  "Product"
);
