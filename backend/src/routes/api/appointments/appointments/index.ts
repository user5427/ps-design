import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { z } from "zod";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
} from "./service";
import { getBusinessId, getUserId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type CreateAppointmentBody,
  CreateAppointmentSchema,
  AppointmentIdParam,
  type AppointmentIdParams,
  type UpdateAppointmentBody,
  UpdateAppointmentSchema,
  AppointmentFilterSchema,
  type AppointmentFilterQuery,
  AppointmentStatusEnum,
} from "@ps-design/schemas/appointments/appointment";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";

const StatusUpdateSchema = z.object({
  status: AppointmentStatusEnum,
});

type StatusUpdateBody = z.infer<typeof StatusUpdateSchema>;

export default async function appointmentsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_READ),
      ],
      schema: {
        querystring: AppointmentFilterSchema,
      },
    },
    async (request, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const appointments = await getAllAppointments(
        fastify,
        businessId,
        request.query as AppointmentFilterQuery,
      );
      return reply.send(appointments);
    },
  );

  server.post<{ Body: CreateAppointmentBody }>(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_WRITE),
      ],
      schema: {
        body: CreateAppointmentSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateAppointmentBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const userId = getUserId(request, reply);
      if (!userId) return;

      try {
        await createAppointment(fastify, businessId, userId, request.body);
        return reply.code(httpStatus.CREATED).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Params: AppointmentIdParams }>(
    "/:appointmentId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_READ),
      ],
      schema: {
        params: AppointmentIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: AppointmentIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { appointmentId } = request.params;

      try {
        const appointment = await getAppointmentById(
          fastify,
          businessId,
          appointmentId,
        );
        return reply.send(appointment);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put<{ Params: AppointmentIdParams; Body: UpdateAppointmentBody }>(
    "/:appointmentId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_WRITE),
      ],
      schema: {
        params: AppointmentIdParam,
        body: UpdateAppointmentSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: AppointmentIdParams;
        Body: UpdateAppointmentBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { appointmentId } = request.params;

      try {
        await updateAppointment(
          fastify,
          businessId,
          appointmentId,
          request.body,
        );
        return reply.send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.patch<{ Params: AppointmentIdParams; Body: StatusUpdateBody }>(
    "/:appointmentId/status",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_WRITE),
      ],
      schema: {
        params: AppointmentIdParam,
        body: StatusUpdateSchema,
      },
    },
    async (request, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { appointmentId } = request.params as AppointmentIdParams;

      try {
        await updateAppointmentStatus(
          fastify,
          businessId,
          appointmentId,
          (request.body as StatusUpdateBody).status,
        );
        return reply.send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
