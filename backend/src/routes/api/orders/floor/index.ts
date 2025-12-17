import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  createFloorTable,
  deleteFloorTable,
  getFloorPlan,
  updateFloorTable,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  FloorPlanResponseSchema,
  FloorTableSchema,
  TableIdParam,
  type TableIdParams,
  UpdateFloorTableSchema,
  type UpdateFloorTableBody,
  CreateFloorTableSchema,
  type CreateFloorTableBody,
} from "@ps-design/schemas/order/floor";
import { SuccessResponseSchema } from "@ps-design/schemas/shared/response-types";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";

export default async function floorRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.ORDERS)],
      schema: {
        response: {
          200: FloorPlanResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const result = await getFloorPlan(fastify, businessId);
        return reply.send(result);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post<{ Body: CreateFloorTableBody }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.ORDERS)],
      schema: {
        body: CreateFloorTableSchema,
        response: {
          201: FloorTableSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateFloorTableBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const result = await createFloorTable(
          fastify,
          businessId,
          request.body,
        );
        return reply.code(201).send(result);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.patch<{ Params: TableIdParams; Body: UpdateFloorTableBody }>(
    "/:tableId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.ORDERS)],
      schema: {
        params: TableIdParam,
        body: UpdateFloorTableSchema,
        response: {
          200: FloorTableSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: TableIdParams;
        Body: UpdateFloorTableBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const result = await updateFloorTable(
          fastify,
          businessId,
          request.params.tableId,
          request.body,
        );
        return reply.send(result);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.delete<{ Params: TableIdParams }>(
    "/:tableId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.ORDERS)],
      schema: {
        params: TableIdParam,
        response: {
          200: SuccessResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: TableIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        await deleteFloorTable(fastify, businessId, request.params.tableId);
        return reply.send({ success: true });
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
