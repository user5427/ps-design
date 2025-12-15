import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  bulkDeleteMenuItems,
  createMenuItem,
  getAllMenuItems,
  getMenuItemById,
  updateMenuItem,
} from "./service";
import { getBusinessId } from "@/shared/auth-utils";
import { handleServiceError } from "@/shared/error-handler";
import {
  type CreateMenuItemBody,
  CreateMenuItemSchema,
  MenuItemIdParam,
  type MenuItemIdParams,
  type UpdateMenuItemBody,
  UpdateMenuItemSchema,
} from "@ps-design/schemas/menu/items";
import {
  BulkDeleteSchema,
  type BulkDeleteBody,
} from "@ps-design/schemas/shared";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import { AuditActionType } from "@/modules/audit";

export default async function menuItemsRoutes(fastify: FastifyInstance) {
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

      const menuItems = await getAllMenuItems(fastify, businessId);
      return reply.send(menuItems);
    },
  );

  server.post<{ Body: CreateMenuItemBody }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU_WRITE)],
      schema: {
        body: CreateMenuItemSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateMenuItemBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      try {
        const wrapCreateMenuItem = await fastify.audit.generic(
          createMenuItem,
          AuditActionType.CREATE,
          request,
          reply,
          "MenuItem",
        );

        const menuItem = await wrapCreateMenuItem(
          fastify,
          businessId,
          request.body,
        );
        return reply.code(httpStatus.CREATED).send(menuItem);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.get<{ Params: MenuItemIdParams }>(
    "/:menuItemId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU_READ)],
      schema: {
        params: MenuItemIdParam,
      },
    },
    async (
      request: FastifyRequest<{
        Params: MenuItemIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { menuItemId } = request.params;

      try {
        const menuItem = await getMenuItemById(fastify, businessId, menuItemId);
        return reply.send(menuItem);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  server.put<{ Params: MenuItemIdParams; Body: UpdateMenuItemBody }>(
    "/:menuItemId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU_WRITE)],
      schema: {
        params: MenuItemIdParam,
        body: UpdateMenuItemSchema,
      },
    },
    async (
      request: FastifyRequest<{
        Params: MenuItemIdParams;
        Body: UpdateMenuItemBody;
      }>,
      reply: FastifyReply,
    ) => {
      const businessId = getBusinessId(request, reply);
      if (!businessId) return;

      const { menuItemId } = request.params;

      try {
        const wrapUpdateMenuItem = await fastify.audit.generic(
          updateMenuItem,
          AuditActionType.UPDATE,
          request,
          reply,
          "MenuItem",
          menuItemId,
        );

        const updated = await wrapUpdateMenuItem(
          fastify,
          businessId,
          menuItemId,
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
        const wrapBulkDeleteMenuItems = await fastify.audit.generic(
          bulkDeleteMenuItems,
          AuditActionType.DELETE,
          request,
          reply,
          "MenuItem",
          request.body.ids,
        );

        await wrapBulkDeleteMenuItems(fastify, businessId, request.body.ids);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
