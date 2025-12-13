import type { FastifyInstance } from "fastify";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { z } from "zod";
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

const UserIdParam = z.object({
  userId: z.string().uuid(),
});

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  businessId: z.string().uuid().optional(),
  isOwner: z.boolean().optional(),
});

const AssignRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()),
});

const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  businessId: z.string().nullable(),
  roles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const UsersResponseSchema = z.array(UserResponseSchema);

export default async function userRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  // Get users for a business
  server.get<{ Querystring: { businessId?: string } }>(
    "/",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.USER_READ)],
      schema: {
        querystring: z.object({ businessId: z.string().uuid().optional() }),
        response: {
          200: UsersResponseSchema,
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
  server.get<{ Params: { userId: string } }>(
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
        Params: { userId: string };
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
    Body: z.infer<typeof CreateUserSchema>;
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
        Body: z.infer<typeof CreateUserSchema>;
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
    Params: { userId: string };
    Body: z.infer<typeof AssignRolesSchema>;
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
        Params: { userId: string };
        Body: z.infer<typeof AssignRolesSchema>;
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
    Params: { userId: string; roleId: string };
  }>(
    "/:userId/roles/:roleId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.USER_WRITE)],
      schema: {
        params: z.object({
          userId: z.string().uuid(),
          roleId: z.string().uuid(),
        }),
        response: {
          200: SuccessResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { userId: string; roleId: string };
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
        return reply.send({ message: "Role removed successfully" });
      } catch (error) {
        return handleServiceError(error, reply);
      }
    },
  );

  // Update user
  server.put<{
    Params: { userId: string };
    Body: { email?: string; name?: string };
  }>(
    "/:userId",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.SUPERADMIN)],
      schema: {
        params: UserIdParam,
        body: z.object({
          email: z.string().email().optional(),
          name: z.string().min(1).optional(),
        }),
        response: {
          200: UserResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { userId: string };
        Body: { email?: string; name?: string };
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
  server.delete<{ Params: { userId: string } }>(
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
        Params: { userId: string };
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
