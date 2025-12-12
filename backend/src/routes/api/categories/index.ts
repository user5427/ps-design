import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  bulkDeleteCategories,
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type CreateCategoryBody,
  CreateCategorySchema,
  CategoryIdParam,
  type CategoryIdParams,
  type UpdateCategoryBody,
  UpdateCategorySchema,
} from "@ps-design/schemas/category";
import {
  BulkDeleteSchema,
  type BulkDeleteBody,
} from "@ps-design/schemas/shared";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";

export default async function categoriesRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU_READ)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const categories = await getAllCategories(fastify, businessId);
      return reply.send(categories);
    },
  );

  server.post<{ Body: CreateCategoryBody }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU_WRITE)],
      schema: {
        body: CreateCategorySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateCategoryBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const category = await createCategory(
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

  server.get<{ Params: CategoryIdParams }>(
    "/:categoryId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU_READ)],
      schema: {
        params: CategoryIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: CategoryIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { categoryId } = request.params;

      try {
        const category = await getCategoryById(fastify, businessId, categoryId);
        return reply.send(category);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put<{ Params: CategoryIdParams; Body: UpdateCategoryBody }>(
    "/:categoryId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU_WRITE)],
      schema: {
        params: CategoryIdParam,
        body: UpdateCategorySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: CategoryIdParams;
        Body: UpdateCategoryBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { categoryId } = request.params;

      try {
        const updated = await updateCategory(
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
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU_DELETE)],
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
        await bulkDeleteCategories(fastify, businessId, request.body.ids);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
