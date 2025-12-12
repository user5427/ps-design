import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import type { z } from "zod";
import {
  createStockChange,
  getStockChangesPaginated,
  updateStockChange,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import {
  type CreateStockChangeBody,
  CreateStockChangeSchema,
  ChangeIdParam,
  type ChangeIdParams,
  PaginatedStockChangeResponseSchema,
  UpdateStockChangeSchema,
  type UpdateStockChangeBody,
} from "@ps-design/schemas/inventory/stock-change";
import { UniversalPaginationQuerySchema, type UniversalPaginationQuery } from "@ps-design/schemas/pagination";

export default async function stockChangesRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.post<{ Body: CreateStockChangeBody }>(
    "/",
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

  server.get<{ Querystring: z.infer<typeof UniversalPaginationQuerySchema> }>(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_READ),
      ],
      schema: {
        querystring: UniversalPaginationQuerySchema,
        response: {
          200: PaginatedStockChangeResponseSchema,
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

  server.put<{ Params: ChangeIdParams; Body: UpdateStockChangeBody }>(
    "/:changeId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.INVENTORY_WRITE),
      ],
      schema: {
        params: ChangeIdParam,
        body: UpdateStockChangeSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ChangeIdParams;
        Body: UpdateStockChangeBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { changeId } = request.params;

      try {
        const stockChange = await updateStockChange(
          fastify,
          businessId,
          changeId,
          request.body,
        );
        return reply.send(stockChange);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
