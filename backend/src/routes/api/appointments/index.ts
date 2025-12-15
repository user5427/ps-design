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
  initiatePayment,
  payAppointment,
  refundAppointment,
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
  AppointmentStatusEnum,
  PayAppointmentSchema,
  type PayAppointmentBody,
  RefundAppointmentSchema,
  type RefundAppointmentBody,
} from "@ps-design/schemas/appointments/appointment";
import {
  InitiatePaymentSchema,
  type InitiatePaymentBody,
} from "@ps-design/schemas/payments";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import { AuditActionType } from "@/modules/audit";

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
        requireScope(ScopeNames.APPOINTMENTS),
      ],
      schema: {},
    },
    async (request, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const appointments = await getAllAppointments(fastify, businessId);
      return reply.send(appointments);
    },
  );

  server.post<{ Body: CreateAppointmentBody }>(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS),
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
        const createAppointmentWrapped = await fastify.audit.generic(
          createAppointment,
          AuditActionType.CREATE,
          request,
          reply,
          "Appointment",
        );

        await createAppointmentWrapped(
          fastify,
          businessId,
          userId,
          request.body,
        );
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
        requireScope(ScopeNames.APPOINTMENTS),
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
        requireScope(ScopeNames.APPOINTMENTS),
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
        const updateAppointmentWrapped = await fastify.audit.generic(
          updateAppointment,
          AuditActionType.UPDATE,
          request,
          reply,
          "Appointment",
          appointmentId,
        );

        await updateAppointmentWrapped(
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
        requireScope(ScopeNames.APPOINTMENTS),
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
        const updateAppointmentStatusWrapped = await fastify.audit.generic(
          updateAppointmentStatus,
          AuditActionType.UPDATE,
          request,
          reply,
          "Appointment",
          appointmentId,
        );

        await updateAppointmentStatusWrapped(
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

  // Initiate Stripe payment - creates PaymentIntent
  const InitiatePaymentBodySchema = InitiatePaymentSchema.omit({
    appointmentId: true,
  });
  type InitiatePaymentBodyType = Omit<InitiatePaymentBody, "appointmentId">;

  server.post<{ Params: AppointmentIdParams; Body: InitiatePaymentBodyType }>(
    "/:appointmentId/pay/initiate",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS),
      ],
      schema: {
        params: AppointmentIdParam,
        body: InitiatePaymentBodySchema,
      },
    },
    async (request, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { appointmentId } = request.params;

      try {
        const result = await initiatePayment(
          fastify,
          businessId,
          appointmentId,
          request.body,
        );
        return reply.send(result);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Pay appointment
  server.post<{ Params: AppointmentIdParams; Body: PayAppointmentBody }>(
    "/:appointmentId/pay",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS),
      ],
      schema: {
        params: AppointmentIdParam,
        body: PayAppointmentSchema,
      },
    },
    async (request, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const userId = getUserId(request, reply);
      if (!userId) return;

      const { appointmentId } = request.params;

      try {
        const payAppointmentWrapped = await fastify.audit.generic(
          payAppointment,
          AuditActionType.UPDATE,
          request,
          reply,
          "AppointmentPayment",
          appointmentId,
        );

        await payAppointmentWrapped(
          fastify,
          businessId,
          appointmentId,
          userId,
          request.body,
        );
        return reply.code(httpStatus.OK).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Refund appointment
  server.post<{ Params: AppointmentIdParams; Body: RefundAppointmentBody }>(
    "/:appointmentId/refund",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS),
      ],
      schema: {
        params: AppointmentIdParam,
        body: RefundAppointmentSchema,
      },
    },
    async (request, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const userId = getUserId(request, reply);
      if (!userId) return;

      const { appointmentId } = request.params;

      try {
        const refundAppointmentWrapped = await fastify.audit.generic(
          refundAppointment,
          AuditActionType.UPDATE,
          request,
          reply,
          "AppointmentPayment",
          appointmentId,
        );

        await refundAppointmentWrapped(
          fastify,
          businessId,
          appointmentId,
          userId,
          request.body,
        );
        return reply.code(httpStatus.OK).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
