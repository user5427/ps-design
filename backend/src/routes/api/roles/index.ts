import type { FastifyInstance } from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
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
import { requireAuthUser } from "@/shared/auth-utils";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from "@ps-design/schemas/shared/response-types";
import {
  type RoleIdParams,
  RoleIdParam,
  type CreateRoleBody,
  CreateRoleSchema,
  type UpdateRoleBody,
  UpdateRoleSchema,
  type AssignScopesBody,
  AssignScopesSchema,
  type RoleQuery,
  RoleQuerySchema,
  RoleResponseSchema,
  RolesResponseSchema,
} from "@ps-design/schemas/role";

export default async function roleRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  // Get roles for a business or all roles (if no businessId, requires SUPERADMIN)
  server.get<{ Querystring: RoleQuery }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.ROLE_READ)],
      schema: {
        querystring: RoleQuerySchema,
        response: {
          200: RolesResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: RoleQuery;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const authUser = requireAuthUser(request, reply);
        if (!authUser) return;

        let roles: any[];
        if (request.query.businessId) {
          // Get roles for a specific business
          roles = await getRolesByBusinessId(
            fastify,
            request.query.businessId,
            authUser,
          );
        } else {
          // Get all roles (requires SUPERADMIN)
          roles = await getAllRoles(fastify, authUser);
        }
        return reply.send(roles);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Get role by ID
  server.get<{ Params: RoleIdParams }>(
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
        Params: RoleIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const authUser = requireAuthUser(request, reply);
        if (!authUser) return;
        const role = await getRoleById(
          fastify,
          request.params.roleId,
          authUser,
        );
        return reply.send(role);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Create role
  server.post<{
    Body: CreateRoleBody;
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
        Body: CreateRoleBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const authUser = requireAuthUser(request, reply);
        if (!authUser) return;
        const role = await createRole(fastify, request.body, authUser);
        return reply.code(httpStatus.CREATED).send(role);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Update role
  server.patch<{
    Params: RoleIdParams;
    Body: UpdateRoleBody;
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
        Params: RoleIdParams;
        Body: UpdateRoleBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const authUser = requireAuthUser(request, reply);
        if (!authUser) return;
        const role = await updateRole(
          fastify,
          request.params.roleId,
          request.body,
          authUser,
        );
        return reply.send(role);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Assign scopes to role
  server.post<{
    Params: RoleIdParams;
    Body: AssignScopesBody;
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
        Params: RoleIdParams;
        Body: AssignScopesBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const authUser = requireAuthUser(request, reply);
        if (!authUser) return;
        const role = await assignScopesToRole(
          fastify,
          request.params.roleId,
          request.body.scopes,
          authUser,
        );
        return reply.send(role);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Delete role
  server.delete<{ Params: RoleIdParams }>(
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
        Params: RoleIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const authUser = requireAuthUser(request, reply);
        if (!authUser) return;
        await deleteRole(fastify, request.params.roleId, authUser);
        return reply.send({ success: true });
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
