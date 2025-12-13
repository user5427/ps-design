import type { FastifyInstance } from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  createUser,
  getUsersByBusinessId,
  getUserById,
  assignRolesToUser,
  updateUser,
  deleteUser,
  removeRoleFromUser,
} from "./service";
import { handleServiceError } from "@/shared/error-handler";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";
import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from "@ps-design/schemas/shared/response-types";
import {
  type UserIdParams,
  UserIdParam,
  type CreateUserBody,
  CreateUserSchema,
  type UpdateUserBody,
  UpdateUserSchema,
  type AssignRolesBody,
  AssignRolesSchema,
  type UserQuery,
  UserQuerySchema,
  type RemoveRoleParams,
  RemoveRoleParam,
  UserResponseSchema,
  UsersResponseSchema,
} from "@ps-design/schemas/user";

export default async function userRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  // Get users for a business
  server.get<{ Querystring: UserQuery }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.USER_READ)],
      schema: {
        querystring: UserQuerySchema,
        response: {
          200: UsersResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: UserQuery;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const users = await getUsersByBusinessId(
          fastify,
          request.query.businessId,
          request.authUser!,
        );
        return reply.send(users);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Get user by ID
  server.get<{ Params: UserIdParams }>(
    "/:userId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.USER_READ)],
      schema: {
        params: UserIdParam,
        response: {
          200: UserResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: UserIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const user = await getUserById(
          fastify,
          request.params.userId,
          request.authUser!,
        );
        return reply.send(user);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Create user (superadmin only)
  server.post<{
    Body: CreateUserBody;
  }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.SUPERADMIN)],
      schema: {
        body: CreateUserSchema,
        response: {
          201: UserResponseSchema,
          401: ErrorResponseSchema,
          400: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: CreateUserBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const user = await createUser(fastify, request.body, request.authUser!);
        return reply.code(httpStatus.CREATED).send(user);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Assign roles to user
  server.post<{
    Params: UserIdParams;
    Body: AssignRolesBody;
  }>(
    "/:userId/roles",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.USER_WRITE)],
      schema: {
        params: UserIdParam,
        body: AssignRolesSchema,
        response: {
          200: UserResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: UserIdParams;
        Body: AssignRolesBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const user = await assignRolesToUser(
          fastify,
          request.params.userId,
          request.body.roleIds,
          request.authUser!,
        );
        return reply.send(user);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Remove role from user
  server.delete<{
    Params: RemoveRoleParams;
  }>(
    "/:userId/roles/:roleId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.USER_WRITE)],
      schema: {
        params: RemoveRoleParam,
        response: {
          200: SuccessResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: RemoveRoleParams;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        await removeRoleFromUser(
          fastify,
          request.params.userId,
          request.params.roleId,
          request.authUser!,
        );
        return reply.send({ success: true });
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Update user
  server.put<{
    Params: UserIdParams;
    Body: UpdateUserBody;
  }>(
    "/:userId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.SUPERADMIN)],
      schema: {
        params: UserIdParam,
        body: UpdateUserSchema,
        response: {
          200: UserResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: UserIdParams;
        Body: UpdateUserBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const user = await updateUser(
          fastify,
          request.params.userId,
          request.body,
          request.authUser!,
        );
        return reply.send(user);
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Delete user
  server.delete<{ Params: UserIdParams }>(
    "/:userId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.SUPERADMIN)],
      schema: {
        params: UserIdParam,
        response: {
          200: SuccessResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: UserIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        await deleteUser(fastify, request.params.userId, request.authUser!);
        return reply.send({ message: "User deleted successfully" });
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );
}
