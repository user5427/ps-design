import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";
import { MenuItemVariationTypeSchema } from "../shared";
import { createPaginatedSchema, type PaginatedType } from "../../pagination";

const ProductRecipeResponseSchema = z.object({
  id: uuid(),
  quantity: z.number(),
  product: z.object({
    id: uuid(),
    name: z.string(),
    productUnit: z.object({
      id: uuid(),
      name: z.string(),
      symbol: z.string().nullable(),
    }),
  }),
});

const MenuItemVariationResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  type: MenuItemVariationTypeSchema,
  priceAdjustment: z.number(),
  isDisabled: z.boolean(),
  isAvailable: z.boolean(),
  addonProducts: z.array(ProductRecipeResponseSchema),
  createdAt: datetime(),
  updatedAt: datetime(),
  deletedAt: datetime().nullable(),
});

const MenuItemCategorySchema = z
  .object({
    id: uuid(),
    name: z.string(),
  })
  .nullable();

export const MenuItemResponseSchema = z.object({
  id: uuid(),
  baseName: z.string(),
  basePrice: z.number(),
  categoryId: uuid().nullable(),
  businessId: uuid(),
  isDisabled: z.boolean(),
  isAvailable: z.boolean(),
  category: MenuItemCategorySchema,
  baseProducts: z.array(ProductRecipeResponseSchema),
  variations: z.array(MenuItemVariationResponseSchema),
  createdAt: datetime(),
  updatedAt: datetime(),
  deletedAt: datetime().nullable(),
});

export type MenuItemResponse = z.infer<typeof MenuItemResponseSchema>;
export type MenuItemVariationResponse = z.infer<
  typeof MenuItemVariationResponseSchema
>;
export type ProductRecipeResponse = z.infer<typeof ProductRecipeResponseSchema>;

/**
 * Paginated menu item list response
 */
export const PaginatedMenuItemResponseSchema = createPaginatedSchema(
  MenuItemResponseSchema,
  "PaginatedMenuItemResponse",
);

export type PaginatedMenuItemResponse = PaginatedType<
  typeof MenuItemResponseSchema
>;
