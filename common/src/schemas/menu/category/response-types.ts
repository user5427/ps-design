import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";
import { createPaginatedSchema, type PaginatedType } from "../../pagination";

export const MenuItemCategoryResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  businessId: uuid(),
  createdAt: datetime(),
  updatedAt: datetime(),
  deletedAt: datetime().nullable(),
});

/**
 * Paginated menu item category list response
 */
export const PaginatedMenuItemCategoryResponseSchema = createPaginatedSchema(
  MenuItemCategoryResponseSchema,
  "PaginatedMenuItemCategoryResponse",
);

export type MenuItemCategoryResponse = z.infer<
  typeof MenuItemCategoryResponseSchema
>;
export type PaginatedMenuItemCategoryResponse = PaginatedType<
  typeof MenuItemCategoryResponseSchema
>;
