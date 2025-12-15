import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  createStockChange,
  getAllStockLevels,
  getStockChanges,
  getStockLevelByProductId,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import {
  type CreateStockChangeBody,
  CreateStockChangeSchema,
  ProductIdParam,
  type ProductIdParams,
  type StockQuery,
  StockQuerySchema,
} from "@ps-design/schemas/inventory/stock";
import { AuditActionType } from "@/modules/audit";

export default async function stockRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const stockLevels = await getAllStockLevels(fastify, businessId);
      return reply.send(stockLevels);
    },
  );

  server.get<{ Params: ProductIdParams }>(
    "/:productId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY),
      ],
      schema: {
        params: ProductIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ProductIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { productId } = request.params;

      try {
        const stockLevel = await getStockLevelByProductId(
          fastify,
          businessId,
          productId,
        );
        return reply.send(stockLevel);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post<{ Body: CreateStockChangeBody }>(
    "/changes",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY),
      ],
      schema: {
        body: CreateStockChangeSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateStockChangeBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const user = request.authUser!;

      try {
        const wrapCreateStockChange = await fastify.audit.generic(
          createStockChange,
          AuditActionType.CREATE,
          request,
          reply,
          "StockChange",
        );

        const stockChange = await wrapCreateStockChange(
          fastify,
          businessId,
          user.id,
          request.body,
        );
        return reply.code(httpStatus.CREATED).send(stockChange);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Querystring: StockQuery }>(
    "/changes",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY),
      ],
      schema: {
        querystring: StockQuerySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: StockQuery;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { productId } = request.query;

      const changes = await getStockChanges(fastify, businessId, productId);
      return reply.send(changes);
    },
  );
}
