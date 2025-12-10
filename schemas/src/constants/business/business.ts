import { BusinessResponseSchema } from "@/schemas/business";
import { createFieldMapping } from "../../utils/field-mapping-builder";

/**
 * Field mapping for Business entity queries
 * TypeScript will warn if you don't map all fields or exclude them
 */
export const BUSINESS_FIELD_MAPPING = createFieldMapping(
  BusinessResponseSchema,
  {
    name: { column: "business.name", type: "string" },
  },
  ["id"] // Explicitly excluded from filtering
);
