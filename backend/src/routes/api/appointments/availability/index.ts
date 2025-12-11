import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  getAvailabilityByServiceId,
  bulkSetAvailability,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type BulkSetAvailabilityBody,
  BulkSetAvailabilitySchema,
  ServiceIdForAvailabilityParam,
  type StaffServiceIdForAvailabilityParams,
} from "@ps-design/schemas/appointments/availability";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";

export default async function availabilityRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  // Get availability for a specific staff service
  server.get<{ Params: StaffServiceIdForAvailabilityParams }>(
    "/staff-service/:serviceId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.APPOINTMENTS_READ)],
      schema: {
        params: ServiceIdForAvailabilityParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: StaffServiceIdForAvailabilityParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { serviceId } = request.params;

      try {
        const availabilities = await getAvailabilityByServiceId(fastify, serviceId);
        return reply.send(availabilities);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Bulk set availability for a staff service (replaces all existing)
  server.put<{
    Params: StaffServiceIdForAvailabilityParams;
    Body: BulkSetAvailabilityBody;
  }>(
    "/staff-service/:serviceId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.APPOINTMENTS_WRITE)],
      schema: {
        params: ServiceIdForAvailabilityParam,
        body: BulkSetAvailabilitySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: StaffServiceIdForAvailabilityParams;
        Body: BulkSetAvailabilityBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { serviceId } = request.params;

      try {
        const availabilities = await bulkSetAvailability(
          fastify,
          businessId,
          serviceId,
          request.body,
        );
        return reply.send(availabilities);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
