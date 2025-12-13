import type { FastifyInstance } from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { ScopeNames, SCOPE_CONFIG } from "@/modules/user/scope.types";
import { handleServiceError } from "@/shared/error-handler";
import {
  ErrorResponseSchema,
} from "@ps-design/schemas/shared/response-types";

const ScopeSchema = z.object({
  name: z.string(),
  description: z.string(),
});

const ScopesResponseSchema = z.array(ScopeSchema);

export default async function scopesRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // Get current user's available scopes
  // If user is superadmin, return all scopes
  // Otherwise, return only the scopes they have
  server.get(
    "/",
    {
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: ScopesResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUser = request.authUser!;
        
        // Get user's scopes from their roles
        const userScopes = await fastify.db.role.getUserScopesFromRoles(
          authUser.roleIds,
        );

        let scopes;

        // If user is superadmin, return all scopes
        if (userScopes.includes(ScopeNames.SUPERADMIN)) {
          scopes = Object.values(ScopeNames).map((scope) => ({
            name: scope,
            description: SCOPE_CONFIG[scope].description,
          }));
        } else {
          // Otherwise, return only the scopes they have
          scopes = userScopes.map((scope) => ({
            name: scope,
            description: SCOPE_CONFIG[scope].description,
          }));
        }

        return reply.send(scopes);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
