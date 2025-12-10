import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  createStockChange,
  getAllStockLevelsPaginated,
  getStockChangesPaginated,
  getStockLevelByProductId,
  updateStockChange,
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
  PaginatedStockLevelResponseSchema,
  PaginatedStockChangeResponseSchema,
} from "@ps-design/schemas/inventory/stock";

export default async function stockRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get<{ Querystring: StockQuery }>(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_READ),
      ],
      schema: {
        querystring: StockQuerySchema,
        response: {
          200: PaginatedStockLevelResponseSchema,
        },
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

      try {
        const stockLevels = await getAllStockLevelsPaginated(
          fastify,
          businessId,
          request.query,
        );
        return reply.send(stockLevels);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Params: ProductIdParams }>(
    "/:productId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_READ),
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
        requireScope(ScopeNames.INVENTORY_WRITE),
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
        const stockChange = await createStockChange(
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
        requireScope(ScopeNames.INVENTORY_READ),
      ],
      schema: {
        querystring: StockQuerySchema,
        response: {
          200: PaginatedStockChangeResponseSchema,
        },
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

      try {
        const changes = await getStockChangesPaginated(
          fastify,
          businessId,
          request.query,
        );
        return reply.send(changes);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
