import { EntityMapping } from "../../utils/field-mapping-builder";

/**
 * Complete mapping for Business entity including fields, display names, and API endpoint
 */
export const BUSINESS_MAPPING: EntityMapping = {
  fields: {
    name: { column: "business.name", type: "string", displayName: "Business Name" },
  },
  endpoint: "/business",
  displayName: "Business"
}
