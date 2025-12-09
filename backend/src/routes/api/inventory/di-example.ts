import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { z } from "zod";
import { ScopeNames } from "@/modules/user/user.scope.types";
import { createScopeMiddleware } from "@/shared/scope-middleware";

/**
 * Inventory routes with scope-based authorization using Fastify hooks
 *
 * Philosophy: Use onRequest hooks for declarative, explicit permission checking.
 * This is the most Fastify-native approach - hooks are first-class citizens.
 *
 * Usage pattern:
 *   server.get("/path", {
 *     onRequest: [fastify.authenticate, requireScope(ScopeNames.INVENTORY_READ)]
 *   }, handler)
 */
export default async function inventoryRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope, requireAllScopes, requireAnyScope } =
    createScopeMiddleware(fastify);

  /**
   * GET /api/inventory/items
   * List all inventory items
   * Required scope: INVENTORY_READ
   */
  server.get(
    "/items",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.INVENTORY_WRITE)],
      schema: {
        response: {
          200: z.object({
            items: z.array(
              z.object({
                id: z.number(),
                name: z.string(),
                quantity: z.number(),
              }),
            ),
          }),
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // By the time we reach here, permission is already validated by requireScope hook
      const user = request.authUser;

      return reply.send({
        items: [
          { id: 1, name: "Item 1", quantity: 100 },
          { id: 2, name: "Item 2", quantity: 50 },
        ],
      });
    },
  );

  /**
   * POST /api/inventory/items
   * Create a new inventory item
   * Required scopes: INVENTORY_READ AND INVENTORY_WRITE
   */
  server.post(
    "/items",
    {
      onRequest: [
        fastify.authenticate,
        requireAllScopes(ScopeNames.INVENTORY_READ, ScopeNames.INVENTORY_WRITE),
      ],
      schema: {
        response: {
          201: z.object({
            id: z.number(),
            name: z.string(),
            createdBy: z.string(),
          }),
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.authUser;

      return reply.code(httpStatus.CREATED).send({
        id: 3,
        name: "New Item",
        createdBy: user?.id,
      });
    },
  );

  /**
   * PUT /api/inventory/items/:id
   * Update an inventory item
   * Required scopes: INVENTORY_READ AND INVENTORY_WRITE
   */
  server.put(
    "/items/:id",
    {
      onRequest: [
        fastify.authenticate,
        requireAllScopes(ScopeNames.INVENTORY_READ, ScopeNames.INVENTORY_WRITE),
      ],
      schema: {
        response: {
          200: z.object({
            success: z.boolean(),
            id: z.string(),
          }),
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      return reply.send({ success: true, id });
    },
  );

  /**
   * DELETE /api/inventory/items/:id
   * Delete an inventory item
   * Required scope: INVENTORY_DELETE OR INVENTORY_WRITE
   */
  server.delete(
    "/items/:id",
    {
      onRequest: [
        fastify.authenticate,
        requireAnyScope(ScopeNames.INVENTORY_DELETE, ScopeNames.INVENTORY_WRITE),
      ],
      schema: {
        response: {
          200: z.object({
            success: z.boolean(),
            deleted: z.boolean(),
          }),
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({ success: true, deleted: true });
    },
  );

  /**
   * PATCH /api/inventory/items/:id/quantity
   * Update item quantity (requires multiple scopes)
   * Required scopes: INVENTORY_READ AND STOCK_WRITE
   */
  server.patch(
    "/items/:id/quantity",
    {
      onRequest: [
        fastify.authenticate,
        requireAllScopes(ScopeNames.INVENTORY_READ, ScopeNames.STOCK_WRITE),
      ],
      schema: {
        response: {
          200: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.authUser;
      request.log.info(`User ${user?.id} updated item quantity`);

      return reply.send({ success: true });
    },
  );
}
