// Re-export all menu types from the shared schemas package
export type {
  MenuItemCategoryResponse,
  CreateMenuItemCategoryBody,
  UpdateMenuItemCategoryBody,
} from "@ps-design/schemas/menu/category";

export type {
  MenuItemResponse,
  MenuItemVariationResponse,
  ProductRecipeResponse,
  CreateMenuItemBody,
  UpdateMenuItemBody,
  CreateVariation,
  UpdateVariation,
  BaseProductRecipe,
} from "@ps-design/schemas/menu/items";

export type { MenuItemVariationType } from "@ps-design/schemas/menu";

export { MenuItemVariationTypeEnum } from "@ps-design/schemas/menu";

export type MenuItemCategory =
  import("@ps-design/schemas/menu/category").MenuItemCategoryResponse;
export type CreateMenuItemCategory =
  import("@ps-design/schemas/menu/category").CreateMenuItemCategoryBody;
export type UpdateMenuItemCategory =
  import("@ps-design/schemas/menu/category").UpdateMenuItemCategoryBody;

export type MenuItem =
  import("@ps-design/schemas/menu/items").MenuItemResponse;
export type MenuItemVariation =
  import("@ps-design/schemas/menu/items").MenuItemVariationResponse;
export type ProductRecipe =
  import("@ps-design/schemas/menu/items").ProductRecipeResponse;
export type CreateMenuItem =
  import("@ps-design/schemas/menu/items").CreateMenuItemBody;
export type UpdateMenuItem =
  import("@ps-design/schemas/menu/items").UpdateMenuItemBody;
