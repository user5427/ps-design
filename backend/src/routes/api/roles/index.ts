import type { FastifyInstance } from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { z } from "zod";
import {
  createRole,
  deleteRole,
  getRoleById,
  getRolesByBusinessId,
  getAllRoles,
  updateRole,
  assignScopesToRole,
  getAvailableScopes,
} from "./service";
import { handleServiceError } from "@/shared/error-handler";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from "@ps-design/schemas/shared/response-types";

const RoleIdParam = z.object({
  roleId: z.string().uuid(),
});

const CreateRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  businessId: z.string().uuid(),
  scopes: z.array(z.string()),
});

const UpdateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const AssignScopesSchema = z.object({
  scopes: z.array(z.string()),
});

const RoleResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  businessId: z.string(),
  isSystemRole: z.boolean(),
  isDeletable: z.boolean(),
  scopes: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const RolesResponseSchema = z.array(RoleResponseSchema);

const AvailableScopesSchema = z.array(
  z.object({
    name: z.string(),
    description: z.string(),
  }),
);

export default async function roleRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  // Get roles for a business or all roles (if no businessId, requires SUPERADMIN)
  server.get<{ Querystring: { businessId?: string } }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.ROLE_READ)],
      schema: {
        querystring: z.object({ businessId: z.string().uuid().optional() }),
        response: {
          200: RolesResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: { businessId?: string };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        let roles;
        if (request.query.businessId) {
          // Get roles for a specific business
          roles = await getRolesByBusinessId(
            fastify,
            request.query.businessId,
            request.authUser!,
          );
        } else {
          // Get all roles (requires SUPERADMIN)
          roles = await getAllRoles(fastify, request.authUser!);
        }
        return reply.send(roles);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Get available scopes (for role creation)
  server.get(
    "/scopes",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.ROLE_READ)],
      schema: {
        response: {
          200: AvailableScopesSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const scopes = await getAvailableScopes(fastify, request.authUser!);
        return reply.send(scopes);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Get role by ID
  server.get<{ Params: { roleId: string } }>(
    "/:roleId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.ROLE_READ)],
      schema: {
        params: RoleIdParam,
        response: {
          200: RoleResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { roleId: string };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const role = await getRoleById(
          fastify,
          request.params.roleId,
          request.authUser!,
        );
        return reply.send(role);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Create role
  server.post<{
    Body: z.infer<typeof CreateRoleSchema>;
  }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.ROLE_WRITE)],
      schema: {
        body: CreateRoleSchema,
        response: {
          201: RoleResponseSchema,
          401: ErrorResponseSchema,
          400: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: z.infer<typeof CreateRoleSchema>;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const role = await createRole(fastify, request.body, request.authUser!);
        return reply.code(httpStatus.CREATED).send(role);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Update role
  server.patch<{
    Params: { roleId: string };
    Body: z.infer<typeof UpdateRoleSchema>;
  }>(
    "/:roleId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.ROLE_WRITE)],
      schema: {
        params: RoleIdParam,
        body: UpdateRoleSchema,
        response: {
          200: RoleResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { roleId: string };
        Body: z.infer<typeof UpdateRoleSchema>;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const role = await updateRole(
          fastify,
          request.params.roleId,
          request.body,
          request.authUser!,
        );
        return reply.send(role);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Assign scopes to role
  server.post<{
    Params: { roleId: string };
    Body: z.infer<typeof AssignScopesSchema>;
  }>(
    "/:roleId/scopes",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.ROLE_WRITE)],
      schema: {
        params: RoleIdParam,
        body: AssignScopesSchema,
        response: {
          200: RoleResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { roleId: string };
        Body: z.infer<typeof AssignScopesSchema>;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const role = await assignScopesToRole(
          fastify,
          request.params.roleId,
          request.body.scopes,
          request.authUser!,
        );
        return reply.send(role);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Delete role
  server.delete<{ Params: { roleId: string } }>(
    "/:roleId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.ROLE_DELETE)],
      schema: {
        params: RoleIdParam,
        response: {
          200: SuccessResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { roleId: string };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        await deleteRole(fastify, request.params.roleId, request.authUser!);
        return reply.send({ message: "Role deleted successfully" });
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
