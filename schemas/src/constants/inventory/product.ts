import { createFieldMapping } from "../../utils/field-mapping-builder";
import { ProductResponseSchema, type ProductResponse } from "../../schemas/inventory/products";

/**
 * Field mapping for Product entity queries
 * TypeScript will warn if you don't map all fields or exclude them
 */
export const PRODUCT_FIELD_MAPPING = createFieldMapping(
  ProductResponseSchema,
  {
    name: { column: "product.name", type: "string" },
    description: { column: "product.description", type: "string" },
    isDisabled: { column: "product.isDisabled", type: "boolean" },
    createdAt: { column: "product.createdAt", type: "date" },
    updatedAt: { column: "product.updatedAt", type: "date" },
  },
  ["id", "productUnitId", "businessId", "deletedAt", "productUnit"]
);

// Re-export for convenience
export { ProductResponseSchema, type ProductResponse };
