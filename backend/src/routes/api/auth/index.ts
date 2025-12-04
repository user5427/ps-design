import * as bcrypt from "bcryptjs";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import httpStatus from "http-status";
import {
  createJti,
  hashToken,
  persistRefreshToken,
  rotateRefreshToken,
  setRefreshCookie,
  signAccessToken,
  signRefreshToken,
} from "./auth-utils";
import {
  type ChangePasswordBody,
  changePasswordSchema,
  type LoginBody,
  loginSchema,
} from "./request-types";
import {
  errorResponseSchema,
  loginResponseSchema,
  refreshResponseSchema,
  successResponseSchema,
  userResponseSchema,
} from "./response-types";

const SALT_LENGTH = 10;

export default async function authRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/login",
    {
      schema: {
        body: loginSchema,
        response: {
          200: loginResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: LoginBody }>,
      reply: FastifyReply,
    ) => {
      const { email, password } = request.body;

      try {
        const user = await fastify.db.user.findByEmail(email);

        if (!user)
          return reply
            .code(httpStatus.UNAUTHORIZED)
            .send({ message: "Unauthorized" });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
          return reply
            .code(httpStatus.UNAUTHORIZED)
            .send({ message: "Unauthorized" });

        const accessToken = signAccessToken(fastify, user);

        const jti = createJti();
        const refreshToken = signRefreshToken(fastify, user.id, jti);

        await persistRefreshToken(fastify, {
          userId: user.id,
          refreshToken,
          jti,
          ip: request.ip,
        });

        setRefreshCookie(fastify, reply, refreshToken);

        return reply.send({
          ...user,
          accessToken,
        });
      } catch (err) {
        request.log.error({ err }, "Login handler failed");
        return reply
          .code(httpStatus.INTERNAL_SERVER_ERROR)
          .send({ message: "Internal Server Error" });
      }
    },
  );

  server.post(
    "/logout",
    {
      schema: {
        response: {
          200: successResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const token = request.cookies.refresh_token;
        if (token) {
          const tokenHash = hashToken(token);
          const tokenDoc =
            await fastify.db.refreshToken.findByTokenHash(tokenHash);

          if (tokenDoc && !tokenDoc.revokedAt) {
            await fastify.db.refreshToken.revoke(tokenDoc.id);
          }
        }

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
          200: userResponseSchema,
          401: errorResponseSchema,
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
        body: changePasswordSchema,
        response: {
          200: successResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: ChangePasswordBody }>,
      reply: FastifyReply,
    ) => {
      const { currentPassword, newPassword } = request.body;
      const user = request.authUser;

      if (!user)
        return reply
          .code(httpStatus.UNAUTHORIZED)
          .send({ message: "Unauthorized" });

      try {
        const dbUser = await fastify.db.user.findById(user.id);

        if (!dbUser)
          return reply
            .code(httpStatus.UNAUTHORIZED)
            .send({ message: "Unauthorized" });

        const valid = await bcrypt.compare(
          currentPassword,
          dbUser.passwordHash,
        );
        if (!valid)
          return reply
            .code(httpStatus.UNAUTHORIZED)
            .send({ message: "Unauthorized" });

        const newHash = await bcrypt.hash(newPassword, SALT_LENGTH);

        await fastify.db.user.update(user.id, {
          passwordHash: newHash,
          isPasswordResetRequired: false,
        });

        return reply.send({ success: true });
      } catch (err) {
        request.log.error({ err }, "Change-password handler failed");
        return reply
          .code(httpStatus.INTERNAL_SERVER_ERROR)
          .send({ message: "Internal Server Error" });
      }
    },
  );

  server.post(
    "/refresh",
    {
      schema: {
        response: {
          200: refreshResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const token = request.cookies.refresh_token;
        if (!token) {
          return reply
            .code(httpStatus.UNAUTHORIZED)
            .send({ message: "No refresh token" });
        }

        let decoded: { userId: string; jti: string };
        try {
          decoded = await fastify.jwt.verify(token, {
            key: fastify.config.REFRESH_TOKEN_SECRET,
          });
        } catch (err) {
          return reply
            .code(httpStatus.UNAUTHORIZED)
            .send({ message: "Invalid or expired refresh token" });
        }

        const tokenHash = hashToken(token);
        const tokenDoc =
          await fastify.db.refreshToken.findByTokenHash(tokenHash);

        if (!tokenDoc) {
          return reply
            .code(httpStatus.UNAUTHORIZED)
            .send({ message: "Refresh token not recognized" });
        }

        if (tokenDoc.jti !== decoded.jti) {
          return reply
            .code(httpStatus.UNAUTHORIZED)
            .send({ message: "Token ID mismatch" });
        }

        if (tokenDoc.revokedAt) {
          return reply
            .code(httpStatus.UNAUTHORIZED)
            .send({ message: "Refresh token revoked" });
        }

        if (tokenDoc.expiresAt < new Date()) {
          return reply
            .code(httpStatus.UNAUTHORIZED)
            .send({ message: "Refresh token expired" });
        }

        const result = await rotateRefreshToken(
          fastify,
          tokenDoc,
          decoded.userId,
          request,
          reply,
        );

        return reply.send({ accessToken: result.accessToken });
      } catch (err) {
        request.log.error({ err }, "Refresh handler failed");
        return reply
          .code(httpStatus.INTERNAL_SERVER_ERROR)
          .send({ message: "Internal Server Error" });
      }
    },
  );
}
