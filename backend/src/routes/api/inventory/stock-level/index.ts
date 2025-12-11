import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  getAllStockLevelsPaginated,
  getStockLevelByProductId,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import {
  StockLevelProductIdParam,
  type StockLevelProductIdParams,
  PaginatedStockLevelResponseSchema,
  StockLevelResponseSchema,
} from "@ps-design/schemas/inventory/stock-level";
import {
  UniversalPaginationQuerySchema,
  type UniversalPaginationQuery,
} from "@ps-design/schemas/pagination";

export default async function stockLevelsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get<{ Querystring: UniversalPaginationQuery }>(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_READ),
      ],
      schema: {
        querystring: UniversalPaginationQuerySchema,
        response: {
          200: PaginatedStockLevelResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: UniversalPaginationQuery;
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

  server.get<{ Params: StockLevelProductIdParams }>(
    "/:productId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_READ),
      ],
      schema: {
        params: StockLevelProductIdParam,
        response: {
          200: StockLevelResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: StockLevelProductIdParams;
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
}
