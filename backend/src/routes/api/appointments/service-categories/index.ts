import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  bulkDeleteServiceCategories,
  createServiceCategory,
  getAllServiceCategories,
  getServiceCategoryById,
  updateServiceCategory,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type CreateServiceCategoryBody,
  CreateServiceCategorySchema,
  ServiceCategoryIdParam,
  type ServiceCategoryIdParams,
  type UpdateServiceCategoryBody,
  UpdateServiceCategorySchema,
} from "@ps-design/schemas/appointments/service-category";
import {
  BulkDeleteSchema,
  type BulkDeleteBody,
} from "@ps-design/schemas/shared";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";

export default async function serviceCategoriesRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.APPOINTMENTS_READ)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const categories = await getAllServiceCategories(fastify, businessId);
      return reply.send(categories);
    },
  );

  server.post<{ Body: CreateServiceCategoryBody }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.APPOINTMENTS_WRITE)],
      schema: {
        body: CreateServiceCategorySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateServiceCategoryBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const category = await createServiceCategory(
          fastify,
          businessId,
          request.body,
        );
        return reply.code(httpStatus.CREATED).send(category);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Params: ServiceCategoryIdParams }>(
    "/:categoryId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.APPOINTMENTS_READ)],
      schema: {
        params: ServiceCategoryIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ServiceCategoryIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { categoryId } = request.params;

      try {
        const category = await getServiceCategoryById(fastify, businessId, categoryId);
        return reply.send(category);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put<{ Params: ServiceCategoryIdParams; Body: UpdateServiceCategoryBody }>(
    "/:categoryId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.APPOINTMENTS_WRITE)],
      schema: {
        params: ServiceCategoryIdParam,
        body: UpdateServiceCategorySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: ServiceCategoryIdParams;
        Body: UpdateServiceCategoryBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { categoryId } = request.params;

      try {
        const updated = await updateServiceCategory(
          fastify,
          businessId,
          categoryId,
          request.body,
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
        await bulkDeleteServiceCategories(fastify, businessId, request.body.ids);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
