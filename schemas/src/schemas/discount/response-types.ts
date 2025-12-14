import { z } from "zod";
import { uuid, datetime } from "../shared/zod-utils";

export const DiscountResponseSchema = z.object({
    id: uuid(),
    name: z.string(),
    type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    value: z.number(),
    targetType: z.enum(["ORDER", "MENU_ITEM", "SERVICE"]),
    menuItemId: uuid().nullable(),
    menuItemName: z.string().nullable(),
    serviceDefinitionId: uuid().nullable(),
    serviceDefinitionName: z.string().nullable(),
    startsAt: datetime().nullable(),
    expiresAt: datetime().nullable(),
    isDisabled: z.boolean(),
    createdAt: datetime(),
    updatedAt: datetime(),
});

export const ApplicableDiscountResponseSchema = z.object({
    id: uuid(),
    name: z.string(),
    type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    value: z.number(),
    calculatedAmount: z.number(),
});

export type DiscountResponse = z.infer<typeof DiscountResponseSchema>;
export type ApplicableDiscountResponse = z.infer<
    typeof ApplicableDiscountResponseSchema
>;
