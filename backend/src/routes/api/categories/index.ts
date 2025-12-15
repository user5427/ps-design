import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  bulkDeleteCategories,
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  assignTaxToCategory,
  removeTaxFromCategory,
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
  type AssignTaxToCategoryBody,
  AssignTaxToCategorySchema,
} from "@ps-design/schemas/category";
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
      onRequest: [fastify.authenticate, requireScope(ScopeNames.CATEGORIES)],
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
      onRequest: [fastify.authenticate, requireScope(ScopeNames.CATEGORIES)],
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
        const wrapCreateCategory = await fastify.audit.generic(
          createCategory,
          AuditActionType.CREATE,
          request,
          reply,
          "Category",
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
      onRequest: [fastify.authenticate, requireScope(ScopeNames.CATEGORIES)],
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
      onRequest: [fastify.authenticate, requireScope(ScopeNames.CATEGORIES)],
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
        const wrapUpdateCategory = await fastify.audit.generic(
          updateCategory,
          AuditActionType.UPDATE,
          request,
          reply,
          "Category",
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
      onRequest: [fastify.authenticate, requireScope(ScopeNames.CATEGORIES)],
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
          "Category",
          request.body.ids,
        );
        await wrapBulkDeleteCategories(fastify, businessId, request.body.ids);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.patch<{
    Params: CategoryIdParams;
    Body: AssignTaxToCategoryBody;
  }>(
    "/:categoryId/tax",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.CATEGORIES)],
      schema: {
        params: CategoryIdParam,
        body: AssignTaxToCategorySchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: CategoryIdParams;
        Body: AssignTaxToCategoryBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { categoryId } = request.params;
      const { taxId } = request.body as AssignTaxToCategoryBody;

      try {
        const wrapAssignTax = await fastify.audit.generic(
          assignTaxToCategory,
          AuditActionType.UPDATE,
          request,
          reply,
          "Category",
          categoryId,
        );

        const updatedCategory = await wrapAssignTax(
          fastify,
          businessId,
          categoryId,
          taxId,
        );

        return reply.send(updatedCategory);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.delete<{ Params: CategoryIdParams }>(
    "/:categoryId/tax",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.CATEGORIES)],
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
        const wrapRemoveTax = await fastify.audit.generic(
          removeTaxFromCategory,
          AuditActionType.UPDATE,
          request,
          reply,
          "Category",
          categoryId,
        );

        const updatedCategory = await wrapRemoveTax(
          fastify,
          businessId,
          categoryId,
        );

        return reply.send(updatedCategory);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
