import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { z } from "zod";
import {
  bulkDeleteServiceDefinitions,
  createServiceDefinition,
  getAllServiceDefinitions,
  getServiceDefinitionById,
  updateServiceDefinition,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type CreateServiceDefinitionBody,
  CreateServiceDefinitionSchema,
  ServiceDefinitionIdParam,
  type ServiceDefinitionIdParams,
  type UpdateServiceDefinitionBody,
  UpdateServiceDefinitionSchema,
} from "@ps-design/schemas/appointments/service-definition";
import {
  BulkDeleteSchema,
  type BulkDeleteBody,
} from "@ps-design/schemas/shared";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import { AuditActionType } from "@/modules/audit";

const ServiceDefinitionFilterSchema = z.object({
  active: z.string().optional(),
});

type ServiceDefinitionFilterQuery = z.infer<
  typeof ServiceDefinitionFilterSchema
>;

export default async function serviceDefinitionsRoutes(
  fastify: FastifyInstance,
) {
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
        querystring: ServiceDefinitionFilterSchema,
      },
    },
    async (request, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const query = request.query as ServiceDefinitionFilterQuery;
      const activeOnly = query.active === "true";
      const definitions = await getAllServiceDefinitions(fastify, businessId, {
        activeOnly,
      });
      return reply.send(definitions);
    },
  );

  server.post<{ Body: CreateServiceDefinitionBody }>(
    "/",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_WRITE),
      ],
      schema: {
        body: CreateServiceDefinitionSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateServiceDefinitionBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const createServiceDefinitionWrapped = await fastify.audit.generic(
          createServiceDefinition,
          AuditActionType.CREATE,
          request,
          reply,
          "ServiceDefinition",
        );

        await createServiceDefinitionWrapped(fastify, businessId, request.body);
        return reply.code(httpStatus.CREATED).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Params: ServiceDefinitionIdParams }>(
    "/:serviceDefinitionId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_READ),
      ],
      schema: {
        params: ServiceDefinitionIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ServiceDefinitionIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { serviceDefinitionId } = request.params;

      try {
        const definition = await getServiceDefinitionById(
          fastify,
          businessId,
          serviceDefinitionId,
        );
        return reply.send(definition);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put<{
    Params: ServiceDefinitionIdParams;
    Body: UpdateServiceDefinitionBody;
  }>(
    "/:serviceDefinitionId",
    {
      onRequest: [
        fastify.authenticate,
        requireScope(ScopeNames.APPOINTMENTS_WRITE),
      ],
      schema: {
        params: ServiceDefinitionIdParam,
        body: UpdateServiceDefinitionSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ServiceDefinitionIdParams;
        Body: UpdateServiceDefinitionBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { serviceDefinitionId } = request.params;

      try {
        const updateServiceDefinitionWrapped = await fastify.audit.generic(
          updateServiceDefinition,
          AuditActionType.UPDATE,
          request,
          reply,
          "ServiceDefinition",
          serviceDefinitionId,
        );

        await updateServiceDefinitionWrapped(
          fastify,
          businessId,
          serviceDefinitionId,
          request.body,
        );
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
        const bulkDeleteServiceDefinitionsWrapped = await fastify.audit.generic(
          bulkDeleteServiceDefinitions,
          AuditActionType.DELETE,
          request,
          reply,
          "ServiceDefinition",
          request.body.ids,
        );

        await bulkDeleteServiceDefinitionsWrapped(
          fastify,
          businessId,
          request.body.ids,
        );
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
