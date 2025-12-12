import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  bulkDeleteMenuItems,
  createMenuItem,
  getAllMenuItemsPaginated,
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
  PaginatedMenuItemResponseSchema,
} from "@ps-design/schemas/menu/items";
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

export default async function menuItemsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.get<{ Querystring: UniversalPaginationQuery }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.MENU_READ)],
      schema: {
        querystring: UniversalPaginationQuerySchema,
        response: {
          200: PaginatedMenuItemResponseSchema,
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

      const menuItems = await getAllMenuItemsPaginated(
        fastify,
        businessId,
        request.query,
      );
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
        const menuItem = await createMenuItem(
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
        const updated = await updateMenuItem(
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
        await bulkDeleteMenuItems(fastify, businessId, request.body.ids);
        return reply.code(httpStatus.NO_CONTENT).send();
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
