import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  createGiftCard,
  deleteGiftCard,
  getAllGiftCards,
  getGiftCardById,
  updateGiftCard,
  validateGiftCard,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type CreateGiftCardBody,
  CreateGiftCardSchema,
  GiftCardIdParam,
  type GiftCardIdParams,
  type UpdateGiftCardBody,
  UpdateGiftCardSchema,
  ValidateGiftCardSchema,
  type ValidateGiftCardBody,
} from "@ps-design/schemas/gift-card";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import { AuditActionType } from "@/modules/audit";

export default async function giftCardsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.GIFT_CARDS_READ),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const giftCards = await getAllGiftCards(fastify, businessId);
      return reply.send(giftCards);
    },
  );

  server.post<{ Body: CreateGiftCardBody }>(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.GIFT_CARDS_WRITE),
      ],
      schema: {
        body: CreateGiftCardSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateGiftCardBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const createGiftCardWrapped = await fastify.audit.generic(
          createGiftCard,
          AuditActionType.CREATE,
          request,
          reply,
          "GiftCard",
        );

        const giftCard = await createGiftCardWrapped(
          fastify,
          businessId,
          request.body,
        );
        return reply.code(httpStatus.CREATED).send(giftCard);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Params: GiftCardIdParams }>(
    "/:giftCardId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.GIFT_CARDS_READ),
      ],
      schema: {
        params: GiftCardIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: GiftCardIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { giftCardId } = request.params;

      try {
        const giftCard = await getGiftCardById(fastify, businessId, giftCardId);
        return reply.send(giftCard);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put<{ Params: GiftCardIdParams; Body: UpdateGiftCardBody }>(
    "/:giftCardId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.GIFT_CARDS_WRITE),
      ],
      schema: {
        params: GiftCardIdParam,
        body: UpdateGiftCardSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: GiftCardIdParams;
        Body: UpdateGiftCardBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { giftCardId } = request.params;

      try {
        const updateGiftCardWrapped = await fastify.audit.generic(
          updateGiftCard,
          AuditActionType.UPDATE,
          request,
          reply,
          "GiftCard",
          giftCardId,
        );

        const updated = await updateGiftCardWrapped(
          fastify,
          businessId,
          giftCardId,
          request.body,
        );
        return reply.send(updated);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.delete<{ Params: GiftCardIdParams }>(
    "/:giftCardId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.GIFT_CARDS_DELETE),
      ],
      schema: {
        params: GiftCardIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: GiftCardIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { giftCardId } = request.params;

      try {
        const deleteGiftCardWrapped = await fastify.audit.generic(
          deleteGiftCard,
          AuditActionType.DELETE,
          request,
          reply,
          "GiftCard",
          giftCardId,
        );

        await deleteGiftCardWrapped(fastify, businessId, giftCardId);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Validate gift card code (for payment flow)
  server.post<{ Body: ValidateGiftCardBody }>(
    "/validate",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU_READ)],
      schema: {
        body: ValidateGiftCardSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: ValidateGiftCardBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const giftCard = await validateGiftCard(
          fastify,
          businessId,
          request.body.code,
        );
        return reply.send(giftCard);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
