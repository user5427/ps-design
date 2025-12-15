import {
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Or,
  type Repository,
} from "typeorm";
import { ConflictError, NotFoundError, BadRequestError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import type { Discount, DiscountTargetType } from "./discount.entity";
import type {
  ICreateDiscount,
  IUpdateDiscount,
  ApplicableDiscountResult,
} from "./discount.types";

export class DiscountRepository {
  constructor(private repository: Repository<Discount>) {}

  async findAllByBusinessId(
    businessId: string,
    targetTypes?: DiscountTargetType[],
  ): Promise<Discount[]> {
    const where: any = { businessId, deletedAt: IsNull() };
    if (targetTypes && targetTypes.length > 0) {
      where.targetType = In(targetTypes);
    }
    return this.repository.find({
      where,
      relations: ["menuItem", "serviceDefinition"],
      order: { createdAt: "DESC" },
    });
  }

  async findById(id: string): Promise<Discount | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ["menuItem", "serviceDefinition"],
    });
  }

  async findByIdAndBusinessId(
    id: string,
    businessId: string,
  ): Promise<Discount | null> {
    return this.repository.findOne({
      where: { id, businessId, deletedAt: IsNull() },
      relations: ["menuItem", "serviceDefinition"],
    });
  }

  async getById(id: string, businessId: string): Promise<Discount> {
    const discount = await this.findByIdAndBusinessId(id, businessId);
    if (!discount) {
      throw new NotFoundError("Discount not found");
    }
    return discount;
  }

  async create(data: ICreateDiscount): Promise<Discount> {
    this.validateDiscountData(data);

    try {
      const discount = this.repository.create({
        name: data.name,
        type: data.type,
        value: data.value,
        targetType: data.targetType,
        menuItemId: data.menuItemId ?? null,
        serviceDefinitionId: data.serviceDefinitionId ?? null,
        startsAt: data.startsAt ?? null,
        expiresAt: data.expiresAt ?? null,
        isDisabled: data.isDisabled ?? false,
        businessId: data.businessId,
      });
      return await this.repository.save(discount);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("Discount with this name already exists");
      }
      throw error;
    }
  }

  async update(
    id: string,
    businessId: string,
    data: IUpdateDiscount,
  ): Promise<Discount> {
    const discount = await this.getById(id, businessId);

    if (
      data.targetType ||
      data.menuItemId !== undefined ||
      data.serviceDefinitionId !== undefined
    ) {
      this.validateDiscountData({
        ...discount,
        ...data,
        businessId,
      });
    }

    try {
      await this.repository.update(id, data);
      return this.getById(id, businessId);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("Discount with this name already exists");
      }
      throw error;
    }
  }

  async delete(id: string, businessId: string): Promise<void> {
    const discount = await this.getById(id, businessId);
    await this.repository.update(discount.id, { deletedAt: new Date() });
  }

  /**
   * Find the best applicable discount for an order.
   * Priority: ORDER > MENU_ITEM
   * Only one discount is applied.
   */

  // TODO: implement this properly

  async findApplicableForOrder(
    businessId: string,
    menuItemIds: string[],
    orderTotal: number,
  ): Promise<ApplicableDiscountResult | null> {
    const now = new Date();

    return null;
  }

  /**
   * Find the best applicable discount for a service/appointment.
   * Priority: ORDER > SERVICE
   * Only one discount is applied.
   */
  async findApplicableForService(
    businessId: string,
    serviceDefinitionId: string,
    servicePrice: number,
  ): Promise<ApplicableDiscountResult | null> {
    const now = new Date();

    // First, try to find an ORDER-level discount (applies to everything)
    const orderDiscount = await this.findActiveDiscount(
      businessId,
      "ORDER",
      now,
    );
    if (orderDiscount) {
      return {
        discount: orderDiscount,
        calculatedAmount: this.calculateDiscountAmount(
          orderDiscount,
          servicePrice,
        ),
      };
    }

    // If no ORDER discount, look for SERVICE-specific discount
    const serviceDiscount = await this.repository.findOne({
      where: {
        businessId,
        deletedAt: IsNull(),
        isDisabled: false,
        targetType: "SERVICE",
        serviceDefinitionId,
        startsAt: Or(IsNull(), LessThanOrEqual(now)),
        expiresAt: Or(IsNull(), MoreThanOrEqual(now)),
      },
    });

    if (serviceDiscount && this.isDiscountActive(serviceDiscount, now)) {
      return {
        discount: serviceDiscount,
        calculatedAmount: this.calculateDiscountAmount(
          serviceDiscount,
          servicePrice,
        ),
      };
    }

    return null;
  }

  private async findActiveDiscount(
    businessId: string,
    targetType: DiscountTargetType,
    now: Date,
  ): Promise<Discount | null> {
    const discounts = await this.repository.find({
      where: {
        businessId,
        deletedAt: IsNull(),
        isDisabled: false,
        targetType,
      },
    });

    for (const discount of discounts) {
      if (this.isDiscountActive(discount, now)) {
        return discount;
      }
    }

    return null;
  }

  private isDiscountActive(discount: Discount, now: Date): boolean {
    if (discount.startsAt && discount.startsAt > now) {
      return false;
    }
    if (discount.expiresAt && discount.expiresAt < now) {
      return false;
    }
    return true;
  }

  private calculateDiscountAmount(
    discount: Discount,
    baseAmount: number,
  ): number {
    if (discount.type === "PERCENTAGE") {
      return Math.round((baseAmount * discount.value) / 100);
    }
    // FIXED_AMOUNT - cap at base amount
    return Math.min(discount.value, baseAmount);
  }

  private validateDiscountData(
    data:
      | ICreateDiscount
      | (IUpdateDiscount & {
          businessId: string;
          targetType: DiscountTargetType;
        }),
  ): void {
    if (data.type === "PERCENTAGE" && data.value !== undefined) {
      if (data.value < 0 || data.value > 100) {
        throw new BadRequestError(
          "Percentage discount must be between 0 and 100",
        );
      }
    }

    if (data.type === "FIXED_AMOUNT" && data.value !== undefined) {
      if (data.value < 1) {
        throw new BadRequestError(
          "Fixed amount discount must be at least 1 cent",
        );
      }
    }

    if (data.targetType === "MENU_ITEM" && !data.menuItemId) {
      throw new BadRequestError(
        "Menu item ID is required for MENU_ITEM discounts",
      );
    }

    if (data.targetType === "SERVICE" && !data.serviceDefinitionId) {
      throw new BadRequestError(
        "Service definition ID is required for SERVICE discounts",
      );
    }

    if (
      data.targetType === "ORDER" &&
      (data.menuItemId || data.serviceDefinitionId)
    ) {
      throw new BadRequestError(
        "ORDER discounts should not have menu item or service IDs",
      );
    }
  }
}
