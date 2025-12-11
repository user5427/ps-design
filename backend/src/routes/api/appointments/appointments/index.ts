import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { z } from "zod";
import {
  bulkDeleteAppointments,
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
  type AppointmentStatus,
} from "@ps-design/schemas/appointments/appointment";
import {
  BulkDeleteSchema,
  type BulkDeleteBody,
} from "@ps-design/schemas/shared";
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
      onRequest: [fastify.authenticate, requireScope(ScopeNames.APPOINTMENTS_READ)],
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
      onRequest: [fastify.authenticate, requireScope(ScopeNames.APPOINTMENTS_WRITE)],
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
        const appointment = await createAppointment(
          fastify,
          businessId,
          userId,
          request.body,
        );
        return reply.code(httpStatus.CREATED).send(appointment);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Params: AppointmentIdParams }>(
    "/:appointmentId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.APPOINTMENTS_READ)],
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
      onRequest: [fastify.authenticate, requireScope(ScopeNames.APPOINTMENTS_WRITE)],
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
        const updated = await updateAppointment(
          fastify,
          businessId,
          appointmentId,
          request.body,
        );
        return reply.send(updated);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.patch<{ Params: AppointmentIdParams; Body: StatusUpdateBody }>(
    "/:appointmentId/status",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.APPOINTMENTS_WRITE)],
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
        const updated = await updateAppointmentStatus(
          fastify,
          businessId,
          appointmentId,
          (request.body as StatusUpdateBody).status,
        );
        return reply.send(updated);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post<{ Body: BulkDeleteBody }>(
    "/bulk-delete",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.APPOINTMENTS_DELETE)],
      schema: {
        body: BulkDeleteSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: BulkDeleteBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        await bulkDeleteAppointments(fastify, businessId, request.body.ids);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
