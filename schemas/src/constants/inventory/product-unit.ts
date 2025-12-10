import { createFieldMapping } from "../../utils/field-mapping-builder";
import { ProductUnitResponseSchema, type ProductUnitResponse } from "../../schemas/inventory/units";

/**
 * Field mapping for Product Unit entity queries
 * TypeScript will warn if you don't map all fields or exclude them
 */
export const PRODUCT_UNIT_FIELD_MAPPING = createFieldMapping(
  ProductUnitResponseSchema,
  {
    name: { column: "unit.name", type: "string" },
    symbol: { column: "unit.symbol", type: "string" },
    createdAt: { column: "unit.createdAt", type: "date" },
    updatedAt: { column: "unit.updatedAt", type: "date" },
  },
  ["id", "businessId", "deletedAt"]
);

// Re-export for convenience
export { ProductUnitResponseSchema, type ProductUnitResponse };
