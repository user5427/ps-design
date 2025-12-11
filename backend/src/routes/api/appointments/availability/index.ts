import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { getAvailabilityByUserId, bulkSetAvailability } from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type BulkSetAvailabilityBody,
  BulkSetAvailabilitySchema,
  UserIdForAvailabilityParam,
  type UserIdForAvailabilityParams,
} from "@ps-design/schemas/appointments/availability";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";

export default async function availabilityRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get<{ Params: UserIdForAvailabilityParams }>(
    "/user/:userId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_READ),
      ],
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
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_WRITE),
      ],
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
}
