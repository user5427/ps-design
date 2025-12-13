import { CreateStaffService } from './../../../../../../frontend/src/schemas/appointments/index';
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  bulkDeleteStaffServices,
  createStaffService,
  getAllStaffServices,
  getStaffServiceById,
  updateStaffService,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type CreateServiceBody,
  CreateServiceSchema,
  ServiceIdParam,
  type ServiceIdParams,
  type UpdateServiceBody,
  UpdateServiceSchema,
} from "@ps-design/schemas/appointments/service";
import {
  BulkDeleteSchema,
  type BulkDeleteBody,
} from "@ps-design/schemas/shared";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import { AuditActionType } from "@/modules/audit";

export default async function staffServicesRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_READ),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const staffServices = await getAllStaffServices(fastify, businessId);
      return reply.send(staffServices);
    },
  );

  server.post<{ Body: CreateServiceBody }>(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_WRITE),
      ],
      schema: {
        body: CreateServiceSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateServiceBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const CreateStaffServiceWrapped = await fastify.audit.generic(
          createStaffService,
          AuditActionType.CREATE,
          request,
          reply,
          "StaffService",
        );

        await CreateStaffServiceWrapped(fastify, businessId, request.body);
        return reply.code(httpStatus.CREATED).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Params: ServiceIdParams }>(
    "/:serviceId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_READ),
      ],
      schema: {
        params: ServiceIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ServiceIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { serviceId } = request.params;

      try {
        const staffService = await getStaffServiceById(
          fastify,
          businessId,
          serviceId,
        );
        return reply.send(staffService);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put<{ Params: ServiceIdParams; Body: UpdateServiceBody }>(
    "/:serviceId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_WRITE),
      ],
      schema: {
        params: ServiceIdParam,
        body: UpdateServiceSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ServiceIdParams;
        Body: UpdateServiceBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { serviceId } = request.params;

      try {
        const updateStaffServiceWrapped = await fastify.audit.generic(
          updateStaffService,
          AuditActionType.UPDATE,
          request,
          reply,
          "StaffService",
          serviceId,
        );

        await updateStaffServiceWrapped(fastify, businessId, serviceId, request.body);
        return reply.send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.post<{ Body: BulkDeleteBody }>(
    "/bulk-delete",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_DELETE),
      ],
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
        const wrapBulkDeleteStaffServices = await fastify.audit.generic(
          bulkDeleteStaffServices,
          AuditActionType.DELETE,
          request,
          reply,
          "StaffService",
          request.body.ids
        );

        await wrapBulkDeleteStaffServices(fastify, businessId, request.body.ids);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
