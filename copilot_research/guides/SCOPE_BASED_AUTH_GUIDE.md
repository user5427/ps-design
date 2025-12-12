/**
 * SCOPE-BASED AUTHORIZATION WITH FASTIFY HOOKS
 *
 * This is the recommended approach - using Fastify's native hook system
 * for declarative, explicit scope checking.
 *
 * ============================================================================
 * SETUP INSTRUCTIONS
 * ============================================================================
 *
 * 1. In any route file, import the factory:
 *
 *    import { createScopeMiddleware } from "@/shared/scope-middleware";
 *    import { ScopeNames } from "@/modules/user/user.scope.types";
 *
 * 2. Create the middleware hooks once per route file:
 *
 *    export default async function myRoutes(fastify: FastifyInstance) {
 *      const { requireScope, requireAllScopes, requireAnyScope } =
 *        createScopeMiddleware(fastify);
 *
 * 3. Use hooks in your route definitions:
 *
 *    server.get("/items", {
 *      onRequest: [fastify.authenticate, requireScope(ScopeNames.INVENTORY_READ)]
 *    }, handler)
 *
 * ============================================================================
 * PATTERNS
 * ============================================================================
 *
 * Pattern 1: Single required scope
 * ─────────────────────────────────
 * onRequest: [fastify.authenticate, requireScope(ScopeNames.INVENTORY_READ)]
 *
 * Pattern 2: Multiple scopes (ALL required)
 * ──────────────────────────────────────────
 * onRequest: [
 *   fastify.authenticate,
 *   requireAllScopes(ScopeNames.INVENTORY_READ, ScopeNames.INVENTORY_WRITE)
 * ]
 *
 * Pattern 3: Multiple scopes (ANY one required)
 * ──────────────────────────────────────────────
 * onRequest: [
 *   fastify.authenticate,
 *   requireAnyScope(ScopeNames.INVENTORY_DELETE, ScopeNames.INVENTORY_WRITE)
 * ]
 *
 * ============================================================================
 * BENEFITS
 * ============================================================================
 *
 * ✅ Declarative - permissions are obvious at a glance
 * ✅ Early exit - returns 403 before handler executes if permission denied
 * ✅ Type-safe - ScopeNames enum prevents typos
 * ✅ Composable - combine multiple hooks easily
 * ✅ Fastify-native - uses hooks, the framework's pattern
 * ✅ No magic - explicit, easy to understand and test
 * ✅ Zero boilerplate in handlers - permission already validated
 *
 * ============================================================================
 * EXECUTION FLOW
 * ============================================================================
 *
 * Request comes in
 *   ↓
 * [fastify.authenticate] hook runs - validates JWT, sets request.authUser
 *   ↓
 * [requireScope(...)] hook runs - checks if user has scope
 *   ↓
 * If permission denied → returns 403 response, handler never executes
 *   ↓
 * If permission granted → continues to handler
 *   ↓
 * Handler executes with guarantee that user has required scope
 *
 * ============================================================================
 * ERROR RESPONSES
 * ============================================================================
 *
 * 401 Unauthorized (no user)
 * ────────────────────────────
 * Request: GET /items (no auth header)
 * Response: { "message": "Unauthorized" }
 *
 * 403 Forbidden (missing scope)
 * ──────────────────────────────
 * Request: GET /items (auth but no INVENTORY_READ scope)
 * Response: { "message": "Insufficient permissions" }
 *
 * ============================================================================
 * IMPLEMENTATION EXAMPLE
 * ============================================================================
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { ScopeNames } from "@/modules/user/user.scope.types";
import { createScopeMiddleware } from "@/shared/scope-middleware";

export default async function exampleRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // Create scope hooks once
  const { requireScope, requireAllScopes, requireAnyScope } =
    createScopeMiddleware(fastify);

  // Pattern 1: Single scope
  server.get(
    "/public/items",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.INVENTORY_READ)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Permission guaranteed by hook - no need to check
      return reply.send({ items: [] });
    },
  );

  // Pattern 2: All scopes required
  server.post(
    "/public/items",
    {
      onRequest: [
        fastify.authenticate,
        requireAllScopes(
          ScopeNames.INVENTORY_READ,
          ScopeNames.INVENTORY_WRITE,
        ),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // User has both INVENTORY_READ and INVENTORY_WRITE
      return reply.send({ success: true });
    },
  );

  // Pattern 3: Any scope required
  server.delete(
    "/public/items/:id",
    {
      onRequest: [
        fastify.authenticate,
        requireAnyScope(
          ScopeNames.INVENTORY_DELETE,
          ScopeNames.INVENTORY_WRITE,
        ),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // User has either DELETE or WRITE permission
      return reply.send({ success: true });
    },
  );
}

/**
 * ============================================================================
 * MIGRATING EXISTING ROUTES
 * ============================================================================
 *
 * Before:
 * ───────
 * server.get("/items", async (request, reply) => {
 *   const scopeChecker = new ScopeChecker(request, fastify);
 *   const hasScope = await scopeChecker.hasScope(ScopeNames.INVENTORY_READ);
 *   if (!hasScope) {
 *     return reply.code(403).send({ message: "Forbidden" });
 *   }
 *   // ... handler logic
 * })
 *
 * After:
 * ──────
 * server.get("/items", {
 *   onRequest: [fastify.authenticate, requireScope(ScopeNames.INVENTORY_READ)]
 * }, async (request, reply) => {
 *   // ... handler logic (no permission check needed!)
 * })
 *
 * ============================================================================
 * TESTING
 * ============================================================================
 *
 * Test that hook returns 403 when permission denied:
 * ────────────────────────────────────────────────
 * const response = await app.inject({
 *   method: "GET",
 *   url: "/items",
 *   headers: { authorization: "Bearer <token_without_inventory_read>" }
 * });
 *
 * expect(response.statusCode).toBe(403);
 * expect(response.json()).toEqual({
 *   message: "Insufficient permissions"
 * });
 *
 * Test that handler executes when permission granted:
 * ──────────────────────────────────────────────────
 * const response = await app.inject({
 *   method: "GET",
 *   url: "/items",
 *   headers: { authorization: "Bearer <token_with_inventory_read>" }
 * });
 *
 * expect(response.statusCode).toBe(200);
 * expect(response.json().items).toBeDefined();
 *
 * ============================================================================
 * COMMON PATTERNS
 * ============================================================================
 *
 * Read-only endpoint:
 *   onRequest: [fastify.authenticate, requireScope(ScopeNames.INVENTORY_READ)]
 *
 * Create/Update endpoint:
 *   onRequest: [
 *     fastify.authenticate,
 *     requireAllScopes(ScopeNames.INVENTORY_READ, ScopeNames.INVENTORY_WRITE)
 *   ]
 *
 * Delete with override:
 *   onRequest: [
 *     fastify.authenticate,
 *     requireAnyScope(ScopeNames.INVENTORY_DELETE, ScopeNames.INVENTORY_WRITE)
 *   ]
 *
 * Admin action:
 *   onRequest: [
 *     fastify.authenticate,
 *     requireAllScopes(
 *       ScopeNames.USER_READ,
 *       ScopeNames.USER_WRITE,
 *       ScopeNames.BUSINESS_WRITE
 *     )
 *   ]
 *
 * ============================================================================
 */
