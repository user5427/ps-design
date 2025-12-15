import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  getAvailabilityByUserId,
  bulkSetAvailability,
  getAvailableTimeSlots,
  getAvailabilityBlocks,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type BulkSetAvailabilityBody,
  BulkSetAvailabilitySchema,
  UserIdForAvailabilityParam,
  type UserIdForAvailabilityParams,
  GetAvailableTimeSlotsQuerySchema,
  type GetAvailableTimeSlotsQuery,
  GetAvailabilityBlocksQuerySchema,
  type GetAvailabilityBlocksQuery,
} from "@ps-design/schemas/appointments/availability";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";

export default async function availabilityRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get<{ Params: UserIdForAvailabilityParams }>(
    "/user/:userId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: UserIdForAvailabilityParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: UserIdForAvailabilityParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { userId } = request.params;

      try {
        const availabilities = await getAvailabilityByUserId(
          fastify,
          userId,
          businessId,
        );
        return reply.send(availabilities);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put<{
    Params: UserIdForAvailabilityParams;
    Body: BulkSetAvailabilityBody;
  }>(
    "/user/:userId",
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: UserIdForAvailabilityParam,
        body: BulkSetAvailabilitySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: UserIdForAvailabilityParams;
        Body: BulkSetAvailabilityBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { userId } = request.params;

      try {
        await bulkSetAvailability(fastify, businessId, userId, request.body);
        return reply.send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Querystring: GetAvailableTimeSlotsQuery }>(
    "/timeslots",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS),
      ],
      schema: {
        querystring: GetAvailableTimeSlotsQuerySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: GetAvailableTimeSlotsQuery;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const result = await getAvailableTimeSlots(
          fastify,
          businessId,
          request.query,
        );
        return reply.send(result);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Querystring: GetAvailabilityBlocksQuery }>(
    "/blocks",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS),
      ],
      schema: {
        querystring: GetAvailabilityBlocksQuerySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: GetAvailabilityBlocksQuery;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const result = await getAvailabilityBlocks(
          fastify,
          businessId,
          request.query,
        );
        return reply.send(result);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
