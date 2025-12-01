import * as bcrypt from "bcryptjs";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import type { AuthUser } from "../../../plugins/app/auth";
import {
  createJti,
  hashToken,
  persistRefreshToken,
  rotateRefreshToken,
  setRefreshCookie,
  signAccessToken,
  signRefreshToken,
} from "./auth-utils";

const SALT_LENGTH = 10;

const loginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

type LoginBody = z.infer<typeof loginSchema>;
type ChangePasswordBody = z.infer<typeof changePasswordSchema>;

function publicUserData(user: AuthUser) {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    businessId: user.businessId,
    isPasswordResetRequired: user.isPasswordResetRequired,
  };
}

export default async function authRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/login",
    {
      schema: { body: loginSchema },
    },
    async (
      request: FastifyRequest<{ Body: LoginBody }>,
      reply: FastifyReply,
    ) => {
      const { email, password } = request.body;

      try {
        const user = await fastify.prisma.user.findUnique({
          where: { email },
        });

        if (!user) return reply.unauthorized();

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return reply.unauthorized();

        // Issue access token
        const accessToken = signAccessToken(fastify, user);

        // Issue refresh token
        const jti = createJti();
        const refreshToken = signRefreshToken(fastify, user.id, jti);

        // Persist refresh token in database
        await persistRefreshToken(fastify, {
          userId: user.id,
          refreshToken,
          jti,
          ip: request.ip,
        });

        setRefreshCookie(fastify, reply, refreshToken);

        return reply.send({
          ...publicUserData(user),
          accessToken,
        });
      } catch (err) {
        request.log.error({ err }, "Login handler failed");
        return reply.internalServerError();
      }
    },
  );

  server.post(
    "/logout",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const token = request.cookies.refresh_token;
        if (token) {
          const tokenHash = hashToken(token);
          const tokenDoc = await fastify.prisma.refreshToken.findUnique({
            where: { tokenHash },
          });

          if (tokenDoc && !tokenDoc.revokedAt) {
            await fastify.prisma.refreshToken.update({
              where: { id: tokenDoc.id },
              data: { revokedAt: new Date() },
            });
          }
        }

        reply.clearCookie("refresh_token", { path: "/api/auth" });
        return reply.send({ success: true });
      } catch (err) {
        request.log.error({ err }, "Logout handler failed");
        return reply.internalServerError();
      }
    },
  );

  server.get("/me", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.authUser;
    if (!user) return reply.unauthorized();
    return reply.send(publicUserData(user));
  });

  server.post(
    "/change-password",
    {
      schema: { body: changePasswordSchema },
    },
    async (
      request: FastifyRequest<{ Body: ChangePasswordBody }>,
      reply: FastifyReply,
    ) => {
      const { currentPassword, newPassword } = request.body;
      const user = request.authUser;

      if (!user) return reply.unauthorized();

      try {
        const dbUser = await fastify.prisma.user.findUnique({
          where: { id: user.id },
          select: { passwordHash: true },
        });

        if (!dbUser) return reply.unauthorized();

        const valid = await bcrypt.compare(
          currentPassword,
          dbUser.passwordHash,
        );
        if (!valid) return reply.unauthorized();

        const newHash = await bcrypt.hash(newPassword, SALT_LENGTH);

        await fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: newHash,
            isPasswordResetRequired: false,
          },
        });

        return reply.send({ success: true });
      } catch (err) {
        request.log.error({ err }, "Change-password handler failed");
        return reply.internalServerError();
      }
    },
  );

  server.post(
    "/refresh",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const token = request.cookies.refresh_token;
        if (!token) {
          return reply.unauthorized("No refresh token");
        }

        let decoded: { userId: string; jti: string };
        try {
          decoded = await fastify.jwt.verify(token, {
            key: fastify.config.REFRESH_TOKEN_SECRET,
          });
        } catch (err) {
          return reply.unauthorized("Invalid or expired refresh token");
        }

        const tokenHash = hashToken(token);
        const tokenDoc = await fastify.prisma.refreshToken.findUnique({
          where: { tokenHash },
        });

        if (!tokenDoc) {
          return reply.unauthorized("Refresh token not recognized");
        }

        if (tokenDoc.jti !== decoded.jti) {
          return reply.unauthorized("Token ID mismatch");
        }

        if (tokenDoc.revokedAt) {
          return reply.unauthorized("Refresh token revoked");
        }

        if (tokenDoc.expiresAt < new Date()) {
          return reply.unauthorized("Refresh token expired");
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
        return reply.internalServerError();
      }
    },
  );
}
