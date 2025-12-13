import { IsNull, type Repository } from "typeorm";
import { ConflictError, NotFoundError, BadRequestError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import type { GiftCard } from "./gift-card.entity";
import type { ICreateGiftCard, IUpdateGiftCard } from "./gift-card.types";

export class GiftCardRepository {
  constructor(private repository: Repository<GiftCard>) {}

  async findAllByBusinessId(businessId: string): Promise<GiftCard[]> {
    return this.repository.find({
      where: { businessId, deletedAt: IsNull() },
      order: { createdAt: "DESC" },
    });
  }

  async findById(id: string): Promise<GiftCard | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findByIdAndBusinessId(
    id: string,
    businessId: string,
  ): Promise<GiftCard | null> {
    return this.repository.findOne({
      where: { id, businessId, deletedAt: IsNull() },
    });
  }

  async findByCodeAndBusinessId(
    code: string,
    businessId: string,
  ): Promise<GiftCard | null> {
    return this.repository.findOne({
      where: { code, businessId, deletedAt: IsNull() },
    });
  }

  async getById(id: string, businessId: string): Promise<GiftCard> {
    const giftCard = await this.findByIdAndBusinessId(id, businessId);
    if (!giftCard) {
      throw new NotFoundError("Gift card not found");
    }
    return giftCard;
  }

  async create(data: ICreateGiftCard): Promise<GiftCard> {
    try {
      const giftCard = this.repository.create({
        code: data.code,
        value: data.value,
        expiresAt: data.expiresAt ?? null,
        businessId: data.businessId,
      });
      return await this.repository.save(giftCard);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("Gift card with this code already exists");
      }
      throw error;
    }
  }

  async update(
    id: string,
    businessId: string,
    data: IUpdateGiftCard,
  ): Promise<GiftCard> {
    const giftCard = await this.getById(id, businessId);

    if (giftCard.redeemedAt) {
      throw new BadRequestError("Cannot update a redeemed gift card");
    }

    try {
      await this.repository.update(id, data);
      return this.getById(id, businessId);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("Gift card with this code already exists");
      }
      throw error;
    }
  }

  async delete(id: string, businessId: string): Promise<void> {
    const giftCard = await this.getById(id, businessId);
    await this.repository.update(giftCard.id, { deletedAt: new Date() });
  }

  async validateAndRedeem(code: string, businessId: string): Promise<GiftCard> {
    const giftCard = await this.findByCodeAndBusinessId(code, businessId);

    if (!giftCard) {
      throw new NotFoundError("Gift card not found");
    }

    if (giftCard.redeemedAt) {
      throw new BadRequestError("Gift card has already been redeemed");
    }

    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      throw new BadRequestError("Gift card has expired");
    }

    await this.repository.update(giftCard.id, { redeemedAt: new Date() });

    return this.getById(giftCard.id, businessId);
  }

  async validate(code: string, businessId: string): Promise<GiftCard> {
    const giftCard = await this.findByCodeAndBusinessId(code, businessId);

    if (!giftCard) {
      throw new NotFoundError("Gift card not found");
    }

    if (giftCard.redeemedAt) {
      throw new BadRequestError("Gift card has already been redeemed");
    }

    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      throw new BadRequestError("Gift card has expired");
    }

    return giftCard;
  }
}
