import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  changePassword,
  login,
  logout,
  refreshAccessToken,
  impersonateBusiness,
  endImpersonation,
} from "./service";
import { setRefreshCookie, requireAuthUser } from "@/shared/auth-utils";
import {
  type ChangePasswordBody,
  ChangePasswordSchema,
  type LoginBody,
  LoginSchema,
  type ImpersonateBusinessBody,
  ImpersonateBusinessSchema,
  AuthResponseSchema,
  UserResponseSchema,
  RefreshResponseSchema,
} from "@ps-design/schemas/auth";
import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from "@ps-design/schemas/shared/response-types";
import { AuditSecurityType } from "@/modules/audit";
import { createScopeMiddleware } from "@/shared/scope-middleware";
import { ScopeNames } from "@/modules/user";

export default async function authRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const { requireScope } = createScopeMiddleware(fastify);

  server.post(
    "/login",
    {
      schema: {
        body: LoginSchema,
        response: {
          200: AuthResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: LoginBody }>,
      reply: FastifyReply,
    ) => {
      try {
        const loginWrapped = await fastify.audit.security(
          login,
          AuditSecurityType.LOGIN,
          request,
        );
        const result = await loginWrapped(fastify, request, request.body);

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
        const logoutWrapped = await fastify.audit.security(
          logout,
          AuditSecurityType.LOGOUT,
          request,
        );
        await logoutWrapped(fastify, request);

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
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: UserResponseSchema,
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
      return reply.send(UserResponseSchema.parse(user));
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
        const changePasswordWrapped = await fastify.audit.security(
          changePassword,
          AuditSecurityType.PASSWORD_CHANGE,
          request,
        );
        await changePasswordWrapped(fastify, user.id, request.body);

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
        return reply.send(accessToken);
      } catch (err: any) {
        const statusCode = err?.code || httpStatus.INTERNAL_SERVER_ERROR;
        const message = err?.message || "Internal Server Error";
        request.log.error({ err }, "Refresh handler failed");
        return reply.code(statusCode).send({ message });
      }
    },
  );

  server.post<{ Body: ImpersonateBusinessBody }>(
    "/impersonate",
    {
      onRequest: [fastify.authenticate, requireScope(ScopeNames.SUPERADMIN)],
      schema: {
        body: ImpersonateBusinessSchema,
        response: {
          200: AuthResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: ImpersonateBusinessBody }>,
      reply: FastifyReply,
    ) => {
      try {
        const authUser = requireAuthUser(request, reply);
        if (!authUser) return;

        const result = await impersonateBusiness(
          fastify,
          request,
          request.body.businessId,
          authUser.id,
        );

        setRefreshCookie(fastify, reply, result.refreshToken);

        return reply.send(result);
      } catch (err: any) {
        const statusCode = err?.code || httpStatus.INTERNAL_SERVER_ERROR;
        const message = err?.message || "Internal Server Error";
        request.log.error({ err }, "Impersonate handler failed");
        return reply.code(statusCode).send({ message });
      }
    },
  );

  server.post(
    "/end-impersonation",
    {
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: SuccessResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUser = requireAuthUser(request, reply);
        if (!authUser) return;

        await endImpersonation(fastify, authUser.id);

        reply.clearCookie("refresh_token", { path: "/api/auth" });
        return reply.send({ success: true });
      } catch (err: any) {
        const statusCode = err?.code || httpStatus.INTERNAL_SERVER_ERROR;
        const message = err?.message || "Internal Server Error";
        request.log.error({ err }, "End impersonation handler failed");
        return reply.code(statusCode).send({ message });
      }
    },
  );
}
