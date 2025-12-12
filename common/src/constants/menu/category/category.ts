import { EntityMapping } from "../../../utils/field-mapping-builder";

/**
 * Complete mapping for MenuItemCategory entity including fields, display names, and API endpoint
 */
export const MENU_ITEM_CATEGORY_MAPPING: EntityMapping = {
  fields: {
    name: { column: "category.name", type: "string", displayName: "Category Name" },
    createdAt: { column: "category.createdAt", type: "date", displayName: "Created" },
    updatedAt: { column: "category.updatedAt", type: "date", displayName: "Updated" },
  },
  endpoint: "/menu/categories",
  displayName: "Menu Category"
};
