import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ScopeNames } from "@/modules/user/scope.types";
import { ScopeChecker } from "./scope-checker";

/**
 * Creates Fastify hooks for scope-based authorization.
 *
 * This is the primary pattern for scope checking - declare required scopes
 * as hooks in the route's onRequest array. Fastify will execute them before
 * the route handler, automatically returning 401/403 if permission denied.
 *
 * @example
 * const { requireScope } = createScopeMiddleware(fastify);
 *
 * server.get("/items", {
 *   onRequest: [fastify.authenticate, requireScope(ScopeNames.INVENTORY)]
 * }, handler)
 */
export function createScopeMiddleware(fastify: FastifyInstance) {
  /**
   * Require a single scope
   * Returns 403 if user doesn't have the scope
   */
  const requireScope = (scope: ScopeNames) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const scopeChecker = new ScopeChecker(request, fastify);
        await scopeChecker.requireScope(scope);
      } catch (err: any) {
        return reply.code(err.statusCode).send({ message: err.message });
      }
    };
  };

  /**
   * Require all provided scopes
   * Returns 403 if user is missing any scope
   *
   * @example requireAllScopes(ScopeNames.INVENTORY, ScopeNames.MENU)
   */
  const requireAllScopes = (...scopes: ScopeNames[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const scopeChecker = new ScopeChecker(request, fastify);
        await scopeChecker.requireAllScopes(...scopes);
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        const statusCode = error.statusCode ?? 500;
        const message = error.message ?? "Internal Server Error";
        return reply.code(statusCode).send({ message });
      }
    };
  };

  /**
   * Require at least one of the provided scopes
   * Returns 403 if user has none of the scopes
   *
   * @example requireAnyScope(ScopeNames.INVENTORY, ScopeNames.MENU)
   */
  const requireAnyScope = (...scopes: ScopeNames[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const scopeChecker = new ScopeChecker(request, fastify);
        await scopeChecker.requireAnyScope(...scopes);
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        const statusCode = error.statusCode ?? 500;
        const message = error.message ?? "Internal Server Error";
        return reply.code(statusCode).send({ message });
      }
    };
  };

  return {
    requireScope,
    requireAllScopes,
    requireAnyScope,
  };
}
