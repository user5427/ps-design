import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";

export const MenuItemCategoryResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  businessId: uuid(),
  createdAt: datetime(),
  updatedAt: datetime(),
  deletedAt: datetime().nullable(),
});

export type MenuItemCategoryResponse = z.infer<
  typeof MenuItemCategoryResponseSchema
>;
