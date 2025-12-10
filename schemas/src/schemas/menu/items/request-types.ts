import { z } from "zod";
import { uuid } from "../../shared/zod-utils";
import { MenuItemVariationTypeSchema } from "../shared";

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 50;

const MIN_NAME_MESSAGE = `Name must be at least ${MIN_NAME_LENGTH} characters`;
const MAX_NAME_MESSAGE = `Name must be at most ${MAX_NAME_LENGTH} characters`;

const BaseProductRecipeSchema = z.object({
  productId: uuid("Invalid product ID"),
  quantity: z.number().positive("Quantity must be positive"),
});

const CreateVariationSchema = z.object({
  name: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE),
  type: MenuItemVariationTypeSchema,
  priceAdjustment: z.number().default(0),
  isDisabled: z.boolean().default(false),
  addonProducts: z.array(BaseProductRecipeSchema).default([]),
});

const UpdateVariationSchema = z.object({
  id: uuid().optional(),
  name: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE)
    .optional(),
  type: MenuItemVariationTypeSchema.optional(),
  priceAdjustment: z.number().optional(),
  isDisabled: z.boolean().optional(),
  addonProducts: z.array(BaseProductRecipeSchema).optional(),
});

export const MenuItemIdParam = z.object({ menuItemId: uuid() });

export const CreateMenuItemSchema = z.object({
  baseName: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE),
  basePrice: z.number().nonnegative("Base price must be non-negative"),
  categoryId: uuid().nullable().optional(),
  isDisabled: z.boolean().default(false),
  baseProducts: z.array(BaseProductRecipeSchema).default([]),
  variations: z.array(CreateVariationSchema).default([]),
});

export const UpdateMenuItemSchema = z.object({
  baseName: z
    .string()
    .min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE)
    .max(MAX_NAME_LENGTH, MAX_NAME_MESSAGE)
    .optional(),
  basePrice: z
    .number()
    .nonnegative("Base price must be non-negative")
    .optional(),
  categoryId: uuid().nullable().optional(),
  isDisabled: z.boolean().optional(),
  baseProducts: z.array(BaseProductRecipeSchema).optional(),
  variations: z.array(UpdateVariationSchema).optional(),
  // Array of variation IDs to remove
  removeVariationIds: z.array(uuid()).optional(),
});

export type CreateMenuItemBody = z.infer<typeof CreateMenuItemSchema>;
export type UpdateMenuItemBody = z.infer<typeof UpdateMenuItemSchema>;
export type MenuItemIdParams = z.infer<typeof MenuItemIdParam>;
export type CreateVariation = z.infer<typeof CreateVariationSchema>;
export type UpdateVariation = z.infer<typeof UpdateVariationSchema>;
export type BaseProductRecipe = z.infer<typeof BaseProductRecipeSchema>;
