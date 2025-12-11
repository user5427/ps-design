import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { getFloorPlan, updateFloorTable } from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  FloorPlanResponseSchema,
  FloorTableSchema,
  TableIdParam,
  type TableIdParams,
  UpdateFloorTableSchema,
  type UpdateFloorTableBody,
} from "@ps-design/schemas/order/floor";

export default async function floorRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.get(
    "/",
    {
      onRequest: [fastify.authenticate],
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

  server.patch<{ Params: TableIdParams; Body: UpdateFloorTableBody }>(
    "/:tableId",
    {
      onRequest: [fastify.authenticate],
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
}
