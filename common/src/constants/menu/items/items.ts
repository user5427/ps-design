import type { EntityMapping } from "../../../utils/field-mapping-builder";

/**
 * Complete mapping for MenuItem entity including fields, display names, and API endpoint
 */
export const MENU_ITEM_MAPPING: EntityMapping = {
  fields: {
    baseName: {
      column: "item.baseName",
      type: "string",
      displayName: "Item Name",
    },
    basePrice: {
      column: "item.basePrice",
      type: "number",
      displayName: "Base Price",
    },
    isDisabled: {
      column: "item.isDisabled",
      type: "boolean",
      displayName: "Disabled",
    },
    createdAt: {
      column: "item.createdAt",
      type: "date",
      displayName: "Created",
    },
    updatedAt: {
      column: "item.updatedAt",
      type: "date",
      displayName: "Updated",
    },
  },
  endpoint: "/menu/items",
  displayName: "Menu Item",
};
