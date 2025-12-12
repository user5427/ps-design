import { z } from "zod";

export const MenuItemVariationTypeSchema = z.string().min(1).max(50);

export type MenuItemVariationType = z.infer<typeof MenuItemVariationTypeSchema>;
