import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import { changePassword, login, logout, refreshAccessToken } from "./service";
import { setRefreshCookie } from "@/shared/auth-utils";
import {
  type ChangePasswordBody,
  ChangePasswordSchema,
  type LoginBody,
  LoginSchema,
  AuthUserResponseSchema,
  ErrorResponseSchema,
  LoginResponseSchema,
  RefreshResponseSchema,
  SuccessResponseSchema,
} from "@ps-design/schemas/schemas/auth";

export default async function authRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/login",
    {
      schema: {
        body: LoginSchema,
        response: {
          200: LoginResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: LoginBody }>,
      reply: FastifyReply,
    ) => {
      try {
        const result = await login(fastify, request, request.body);
        setRefreshCookie(fastify, reply, result.refreshToken);

        return reply.send(result);
      } catch (err: any) {
        const statusCode = err?.code || httpStatus.INTERNAL_SERVER_ERROR;
        const message = err?.message || "Internal Server Error";
        request.log.error({ err }, "Login handler failed");
        return reply.code(statusCode).send({ message });
      }
    },
  );

  server.post(
    "/logout",
    {
      schema: {
        response: {
          200: SuccessResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await logout(fastify, request);
        reply.clearCookie("refresh_token", { path: "/api/auth" });
        return reply.send({ success: true });
      } catch (err) {
        request.log.error({ err }, "Logout handler failed");
        return reply
          .code(httpStatus.INTERNAL_SERVER_ERROR)
          .send({ message: "Internal Server Error" });
      }
    },
  );

  server.get(
    "/me",
    {
      schema: {
        response: {
          200: AuthUserResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.authUser;
      if (!user)
        return reply
          .code(httpStatus.UNAUTHORIZED)
          .send({ message: "Unauthorized" });
      return reply.send(user);
    },
  );

  server.post(
    "/change-password",
    {
      schema: {
        body: ChangePasswordSchema,
        response: {
          200: SuccessResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: ChangePasswordBody }>,
      reply: FastifyReply,
    ) => {
      const user = request.authUser;

      if (!user)
        return reply
          .code(httpStatus.UNAUTHORIZED)
          .send({ message: "Unauthorized" });

      try {
        await changePassword(fastify, user.id, request.body);
        return reply.send({ success: true });
      } catch (err: any) {
        const statusCode = err?.code || httpStatus.INTERNAL_SERVER_ERROR;
        const message = err?.message || "Internal Server Error";
        request.log.error({ err }, "Change-password handler failed");
        return reply.code(statusCode).send({ message });
      }
    },
  );

  server.post(
    "/refresh",
    {
      schema: {
        response: {
          200: RefreshResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const accessToken = await refreshAccessToken(fastify, request, reply);
        return reply.send({ accessToken });
      } catch (err: any) {
        const statusCode = err?.code || httpStatus.INTERNAL_SERVER_ERROR;
        const message = err?.message || "Internal Server Error";
        request.log.error({ err }, "Refresh handler failed");
        return reply.code(statusCode).send({ message });
      }
    },
  );
}
