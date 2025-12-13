import type { FastifyInstance } from "fastify";
import type {
  CreateGiftCardBody,
  UpdateGiftCardBody,
  GiftCardResponse,
} from "@ps-design/schemas/gift-card";
import type { GiftCard } from "@/modules/gift-card/gift-card.entity";

function toGiftCardResponse(giftCard: GiftCard): GiftCardResponse {
  return {
    id: giftCard.id,
    code: giftCard.code,
    value: giftCard.value,
    expiresAt: giftCard.expiresAt?.toISOString() ?? null,
    redeemedAt: giftCard.redeemedAt?.toISOString() ?? null,
    createdAt: giftCard.createdAt.toISOString(),
    updatedAt: giftCard.updatedAt.toISOString(),
  };
}

export async function getAllGiftCards(
  fastify: FastifyInstance,
  businessId: string,
): Promise<GiftCardResponse[]> {
  const giftCards = await fastify.db.giftCard.findAllByBusinessId(businessId);
  return giftCards.map(toGiftCardResponse);
}

export async function getGiftCardById(
  fastify: FastifyInstance,
  businessId: string,
  id: string,
): Promise<GiftCardResponse> {
  const giftCard = await fastify.db.giftCard.getById(id, businessId);
  return toGiftCardResponse(giftCard);
}

export async function createGiftCard(
  fastify: FastifyInstance,
  businessId: string,
  data: CreateGiftCardBody,
): Promise<GiftCardResponse> {
  const giftCard = await fastify.db.giftCard.create({
    code: data.code,
    value: data.value,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    businessId,
  });
  return toGiftCardResponse(giftCard);
}

export async function updateGiftCard(
  fastify: FastifyInstance,
  businessId: string,
  id: string,
  data: UpdateGiftCardBody,
): Promise<GiftCardResponse> {
  const updateData: Partial<{
    code?: string;
    value?: number;
    expiresAt?: Date | null;
  }> = {};

  if (data.code !== undefined) {
    updateData.code = data.code;
  }

  if (data.value !== undefined) {
    updateData.value = data.value;
  }

  if (data.expiresAt !== undefined) {
    updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  }

  const giftCard = await fastify.db.giftCard.update(id, businessId, updateData);
  return toGiftCardResponse(giftCard);
}

export async function deleteGiftCard(
  fastify: FastifyInstance,
  businessId: string,
  id: string,
): Promise<void> {
  await fastify.db.giftCard.delete(id, businessId);
}

export async function validateGiftCard(
  fastify: FastifyInstance,
  businessId: string,
  code: string,
): Promise<GiftCardResponse> {
  const giftCard = await fastify.db.giftCard.validate(code, businessId);
  return toGiftCardResponse(giftCard);
}
