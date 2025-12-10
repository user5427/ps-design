import { BusinessResponseSchema } from "@/schemas/business";
import { createEntityMapping } from "../../utils/field-mapping-builder";

/**
 * Complete mapping for Business entity including fields, display names, and API endpoint
 */
export const BUSINESS_MAPPING = createEntityMapping(
  BusinessResponseSchema,
  {
    name: { column: "business.name", type: "string", displayName: "Business Name" },
  },
  ["id"],
  "/api/business",
  "Business"
);
