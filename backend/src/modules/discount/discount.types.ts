import type { DiscountType, DiscountTargetType } from "./discount.entity";

export interface ICreateDiscount {
  name: string;
  type: DiscountType;
  value: number;
  targetType: DiscountTargetType;
  menuItemId?: string | null;
  serviceDefinitionId?: string | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  isDisabled?: boolean;
  businessId: string;
}

export interface IUpdateDiscount {
  name?: string;
  type?: DiscountType;
  value?: number;
  targetType?: DiscountTargetType;
  menuItemId?: string | null;
  serviceDefinitionId?: string | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  isDisabled?: boolean;
}

export interface ApplicableDiscountResult {
  discount: import("./discount.entity").Discount;
  calculatedAmount: number;
}
