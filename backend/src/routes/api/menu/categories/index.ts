import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  bulkDeleteCategories,
  createCategory,
  getAllCategoriesPaginated,
  getCategoryById,
  updateCategory,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type CreateMenuItemCategoryBody,
  CreateMenuItemCategorySchema,
  CategoryIdParam,
  type CategoryIdParams,
  type UpdateMenuItemCategoryBody,
  UpdateMenuItemCategorySchema,
  PaginatedMenuItemCategoryResponseSchema,
} from "@ps-design/schemas/menu/category";
import {
  BulkDeleteSchema,
  type BulkDeleteBody,
} from "@ps-design/schemas/shared";
import {
  UniversalPaginationQuerySchema,
  type UniversalPaginationQuery,
} from "@ps-design/schemas/pagination";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";

export default async function categoriesRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get<{ Querystring: UniversalPaginationQuery }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU_READ)],
      schema: {
        querystring: UniversalPaginationQuerySchema,
        response: {
          200: PaginatedMenuItemCategoryResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: UniversalPaginationQuery;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const categories = await getAllCategoriesPaginated(
        fastify,
        businessId,
        request.query,
      );
      return reply.send(categories);
    },
  );

  server.post<{ Body: CreateMenuItemCategoryBody }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU_WRITE)],
      schema: {
        body: CreateMenuItemCategorySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateMenuItemCategoryBody;
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

  server.put<{ Params: CategoryIdParams; Body: UpdateMenuItemCategoryBody }>(
    "/:categoryId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU_WRITE)],
      schema: {
        params: CategoryIdParam,
        body: UpdateMenuItemCategorySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: CategoryIdParams;
        Body: UpdateMenuItemCategoryBody;
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
