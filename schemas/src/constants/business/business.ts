import { createEntityMapping } from "../../utils/field-mapping-builder";

/**
 * Complete mapping for Business entity including fields, display names, and API endpoint
 */
export const BUSINESS_MAPPING = createEntityMapping(
  {
    name: { column: "business.name", type: "string", displayName: "Business Name" },
  },
  "/business",
  "Business"
);
