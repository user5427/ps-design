import { z } from "zod";

export const MenuItemVariationTypeEnum = z.enum(["SIZE", "FLAVOR", "ADDON"]);

export type MenuItemVariationType = z.infer<typeof MenuItemVariationTypeEnum>;
