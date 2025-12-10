import type { FieldMapping } from "@/shared/pagination-utils";

/**
 * Field mapping for Product entity queries
 */
export const PRODUCT_FIELD_MAPPING: FieldMapping = {
  name: { column: "product.name", type: "string" },
  description: { column: "product.description", type: "string" },
  isDisabled: { column: "product.isDisabled", type: "boolean" },
  createdAt: { column: "product.createdAt", type: "date" },
  updatedAt: { column: "product.updatedAt", type: "date" },
};
