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
  type CreateMenuItemCategoryBody,
  CreateMenuItemCategorySchema,
  CategoryIdParam,
  type CategoryIdParams,
  type UpdateMenuItemCategoryBody,
  UpdateMenuItemCategorySchema,
} from "@ps-design/schemas/menu/category";
import {
  BulkDeleteSchema,
  type BulkDeleteBody,
} from "@ps-design/schemas/shared";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import { AuditActionType } from "@/modules/audit";

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
        const wrapCreateCategory = await fastify.audit.generic(
          createCategory,
          AuditActionType.CREATE,
          request,
          reply,
          "MenuItemCategory",
        );

        const category = await wrapCreateCategory(
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
        const wrapUpdateCategory = await fastify.audit.generic(
          updateCategory,
          AuditActionType.UPDATE,
          request,
          reply,
          "MenuItemCategory",
          categoryId,
        );

        const updated = await wrapUpdateCategory(
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
        const wrapBulkDeleteCategories = await fastify.audit.generic(
          bulkDeleteCategories,
          AuditActionType.DELETE,
          request,
          reply,
          "MenuItemCategory",
        );
        await wrapBulkDeleteCategories(fastify, businessId, request.body.ids);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
