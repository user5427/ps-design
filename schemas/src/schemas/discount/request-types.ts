import { z } from "zod";
import { uuid, datetime } from "../shared/zod-utils";

const DiscountTypeSchema = z.enum(["PERCENTAGE", "FIXED_AMOUNT"]);
const DiscountTargetTypeSchema = z.enum(["ORDER", "MENU_ITEM", "SERVICE"]);

export const DiscountIdParam = z.object({ discountId: uuid() });

export const CreateDiscountSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    type: DiscountTypeSchema,
    value: z.number().int().min(0),
    targetType: DiscountTargetTypeSchema,
    menuItemId: uuid().nullable().optional(),
    serviceDefinitionId: uuid().nullable().optional(),
    startsAt: datetime().nullable().optional(),
    expiresAt: datetime().nullable().optional(),
    isDisabled: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "PERCENTAGE" && (data.value < 0 || data.value > 100)) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount must be between 0 and 100",
      path: ["value"],
    },
  )
  .refine(
    (data) => {
      if (data.type === "FIXED_AMOUNT" && data.value < 1) {
        return false;
      }
      return true;
    },
    {
      message: "Fixed amount discount must be at least 1 cent",
      path: ["value"],
    },
  )
  .refine(
    (data) => {
      if (data.targetType === "MENU_ITEM" && !data.menuItemId) {
        return false;
      }
      return true;
    },
    {
      message: "Menu item ID is required for MENU_ITEM discounts",
      path: ["menuItemId"],
    },
  )
  .refine(
    (data) => {
      if (data.targetType === "SERVICE" && !data.serviceDefinitionId) {
        return false;
      }
      return true;
    },
    {
      message: "Service definition ID is required for SERVICE discounts",
      path: ["serviceDefinitionId"],
    },
  );

export const UpdateDiscountSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    type: DiscountTypeSchema.optional(),
    value: z.number().int().min(0).optional(),
    targetType: DiscountTargetTypeSchema.optional(),
    menuItemId: uuid().nullable().optional(),
    serviceDefinitionId: uuid().nullable().optional(),
    startsAt: datetime().nullable().optional(),
    expiresAt: datetime().nullable().optional(),
    isDisabled: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (
        data.type === "PERCENTAGE" &&
        data.value !== undefined &&
        (data.value < 0 || data.value > 100)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount must be between 0 and 100",
      path: ["value"],
    },
  )
  .refine(
    (data) => {
      if (
        data.type === "FIXED_AMOUNT" &&
        data.value !== undefined &&
        data.value < 1
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Fixed amount discount must be at least 1 cent",
      path: ["value"],
    },
  )
  .refine(
    (data) => {
      if (data.targetType === "MENU_ITEM" && !data.menuItemId) {
        return false;
      }
      return true;
    },
    {
      message: "Menu item ID is required for MENU_ITEM discounts",
      path: ["menuItemId"],
    },
  )
  .refine(
    (data) => {
      if (data.targetType === "SERVICE" && !data.serviceDefinitionId) {
        return false;
      }
      return true;
    },
    {
      message: "Service definition ID is required for SERVICE discounts",
      path: ["serviceDefinitionId"],
    },
  );

export const CreateServiceDiscountSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    type: DiscountTypeSchema,
    value: z.number().int().min(0),
    targetType: z.enum(["SERVICE", "ORDER"]),
    serviceDefinitionId: uuid().nullable().optional(),
    startsAt: datetime().nullable().optional(),
    expiresAt: datetime().nullable().optional(),
    isDisabled: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "PERCENTAGE" && (data.value < 0 || data.value > 100)) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount must be between 0 and 100",
      path: ["value"],
    },
  )
  .refine(
    (data) => {
      if (data.type === "FIXED_AMOUNT" && data.value < 1) {
        return false;
      }
      return true;
    },
    {
      message: "Fixed amount discount must be at least 1 cent",
      path: ["value"],
    },
  )
  .refine(
    (data) => {
      if (data.targetType === "SERVICE" && !data.serviceDefinitionId) {
        return false;
      }
      return true;
    },
    {
      message: "Service definition ID is required associated with a service",
      path: ["serviceDefinitionId"],
    },
  );

export const CreateMenuDiscountSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    type: DiscountTypeSchema,
    value: z.number().int().min(0),
    targetType: z.enum(["MENU_ITEM", "ORDER"]),
    menuItemId: uuid().nullable().optional(),
    startsAt: datetime().nullable().optional(),
    expiresAt: datetime().nullable().optional(),
    isDisabled: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "PERCENTAGE" && (data.value < 0 || data.value > 100)) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount must be between 0 and 100",
      path: ["value"],
    },
  )
  .refine(
    (data) => {
      if (data.type === "FIXED_AMOUNT" && data.value < 1) {
        return false;
      }
      return true;
    },
    {
      message: "Fixed amount discount must be at least 1 cent",
      path: ["value"],
    },
  )
  .refine(
    (data) => {
      if (data.targetType === "MENU_ITEM" && !data.menuItemId) {
        return false;
      }
      return true;
    },
    {
      message: "Menu item ID is required for menu item discounts",
      path: ["menuItemId"],
    },
  );

export const UpdateServiceDiscountSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    type: DiscountTypeSchema.optional(),
    value: z.number().int().min(0).optional(),
    targetType: z.enum(["SERVICE", "ORDER"]).optional(),
    serviceDefinitionId: uuid().nullable().optional(),
    startsAt: datetime().nullable().optional(),
    expiresAt: datetime().nullable().optional(),
    isDisabled: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (
        data.type === "PERCENTAGE" &&
        data.value !== undefined &&
        (data.value < 0 || data.value > 100)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount must be between 0 and 100",
      path: ["value"],
    },
  )
  .refine(
    (data) => {
      if (
        data.type === "FIXED_AMOUNT" &&
        data.value !== undefined &&
        data.value < 1
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Fixed amount discount must be at least 1 cent",
      path: ["value"],
    },
  )
  .refine(
    (data) => {
      if (data.targetType === "SERVICE" && !data.serviceDefinitionId) {
        return false;
      }
      return true;
    },
    {
      message: "Service definition ID is required for SERVICE discounts",
      path: ["serviceDefinitionId"],
    },
  );

export const UpdateMenuDiscountSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    type: DiscountTypeSchema.optional(),
    value: z.number().int().min(0).optional(),
    targetType: z.enum(["MENU_ITEM", "ORDER"]).optional(),
    menuItemId: uuid().nullable().optional(),
    startsAt: datetime().nullable().optional(),
    expiresAt: datetime().nullable().optional(),
    isDisabled: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (
        data.type === "PERCENTAGE" &&
        data.value !== undefined &&
        (data.value < 0 || data.value > 100)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount must be between 0 and 100",
      path: ["value"],
    },
  )
  .refine(
    (data) => {
      if (
        data.type === "FIXED_AMOUNT" &&
        data.value !== undefined &&
        data.value < 1
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Fixed amount discount must be at least 1 cent",
      path: ["value"],
    },
  )
  .refine(
    (data) => {
      if (data.targetType === "MENU_ITEM" && !data.menuItemId) {
        return false;
      }
      return true;
    },
    {
      message: "Menu item ID is required for MENU_ITEM discounts",
      path: ["menuItemId"],
    },
  );

export const GetApplicableOrderDiscountSchema = z.object({
  menuItemIds: z.array(uuid()),
  orderTotal: z.coerce.number().int().min(0),
});

export const GetApplicableServiceDiscountSchema = z.object({
  serviceDefinitionId: uuid(),
  servicePrice: z.coerce.number().int().min(0),
});

export type DiscountIdParams = z.infer<typeof DiscountIdParam>;
export type CreateDiscountBody = z.infer<typeof CreateDiscountSchema>;
export type UpdateDiscountBody = z.infer<typeof UpdateDiscountSchema>;
export type CreateServiceDiscountBody = z.infer<
  typeof CreateServiceDiscountSchema
>;
export type UpdateServiceDiscountBody = z.infer<
  typeof UpdateServiceDiscountSchema
>;
export type CreateMenuDiscountBody = z.infer<typeof CreateMenuDiscountSchema>;
export type UpdateMenuDiscountBody = z.infer<typeof UpdateMenuDiscountSchema>;
export type GetApplicableOrderDiscountQuery = z.infer<
  typeof GetApplicableOrderDiscountSchema
>;
export type GetApplicableServiceDiscountQuery = z.infer<
  typeof GetApplicableServiceDiscountSchema
>;
