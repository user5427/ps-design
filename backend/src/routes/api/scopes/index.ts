import type { FastifyInstance } from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { ScopeNames, SCOPE_CONFIG } from "@/modules/user/scope.types";
import { handleServiceError } from "@/shared/error-handler";
import { requireAuthUser } from "@/shared/auth-utils";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ErrorResponseSchema } from "@ps-design/schemas/shared/response-types";
import { ScopesResponseSchema } from "@ps-design/schemas/scope";

export default async function scopesRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  // Get current user's available scopes
  // If user is superadmin, return all scopes
  // Otherwise, return only the scopes they have
  server.get<{ Querystring: { businessId?: string } }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.ROLE)],
      schema: {
        response: {
          200: ScopesResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { businessId?: string } }>,
      reply: FastifyReply,
    ) => {
      try {
        const authUser = requireAuthUser(request, reply);
        if (!authUser) return;
        const { businessId } = request.query;

        // Get user's scopes from their roles
        const userScopes = await fastify.db.role.getUserScopesFromRoles(
          authUser.roleIds,
        );

        let availableScopes: ScopeNames[];

        // If user is superadmin, return all scopes
        if (userScopes.includes(ScopeNames.SUPERADMIN)) {
          availableScopes = Object.values(ScopeNames);
        } else {
          // Otherwise, return only the scopes they have
          availableScopes = userScopes;
        }

        // Filter out SUPERADMIN scope for non-default businesses
        if (businessId) {
          const business = await fastify.db.business.findById(businessId);
          if (business && !business.isDefault) {
            availableScopes = availableScopes.filter(
              (scope) => scope !== ScopeNames.SUPERADMIN,
            );
          }
        }

        const scopes = availableScopes.map((scope) => ({
          name: scope,
          description: SCOPE_CONFIG[scope].description,
        }));

        return reply.send(scopes);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
