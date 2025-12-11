import { createEntityMapping } from "../../../utils/field-mapping-builder";

/**
 * Complete mapping for Product Unit entity including fields, display names, and API endpoint
 */
export const PRODUCT_UNIT_MAPPING = createEntityMapping(
  {
    name: { column: "unit.name", type: "string", displayName: "Unit Name" },
    symbol: { column: "unit.symbol", type: "string", displayName: "Symbol" },
    createdAt: { column: "unit.createdAt", type: "date", displayName: "Created" },
    updatedAt: { column: "unit.updatedAt", type: "date", displayName: "Updated" },
  },
  "/inventory/units",
  "Product Unit"
);
