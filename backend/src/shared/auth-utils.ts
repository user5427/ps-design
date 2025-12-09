import * as crypto from "crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import type { RefreshToken } from "@/modules/refresh-token";
import type { User } from "@/modules/user";

export function getBusinessId(
  request: FastifyRequest,
  reply: FastifyReply,
): string | null {
  const user = request.authUser;
  if (!user) {
    reply.code(httpStatus.UNAUTHORIZED).send({ message: "Unauthorized" });
    return null;
  }
  if (!user.businessId) {
    reply
      .code(httpStatus.FORBIDDEN)
      .send({ message: "User is not associated with a business" });
    return null;
  }
  return user.businessId;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createJti(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function signAccessToken(fastify: FastifyInstance, user: User): string {
  const payload = {
    userId: user.id,
    businessId: user.businessId,
  };
  return fastify.jwt.sign(payload, {
    expiresIn: fastify.config.ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(
  fastify: FastifyInstance,
  userId: string,
  jti: string,
): string {
  const payload: any = { userId, jti };
  return fastify.jwt.sign(payload, {
    key: fastify.config.REFRESH_TOKEN_SECRET,
    expiresIn: fastify.config.REFRESH_TOKEN_TTL_SEC,
  });
}

export async function persistRefreshToken(
  fastify: FastifyInstance,
  params: {
    userId: string;
    refreshToken: string;
    jti: string;
    ip?: string;
  },
): Promise<void> {
  const tokenHash = hashToken(params.refreshToken);
  const expiresAt = new Date(
    Date.now() + fastify.config.REFRESH_TOKEN_TTL_SEC * 1000,
  );

  await fastify.db.refreshToken.create({
    userId: params.userId,
    tokenHash,
    jti: params.jti,
    expiresAt,
    ip: params.ip ?? null,
  });
}

export function setRefreshCookie(
  fastify: FastifyInstance,
  reply: FastifyReply,
  refreshToken: string,
): void {
  const isProd = fastify.config.NODE_ENV === "production";
  reply.setCookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: fastify.config.REFRESH_TOKEN_TTL_SEC,
  });
}

export async function rotateRefreshToken(
  fastify: FastifyInstance,
  oldToken: RefreshToken,
  userId: string,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<{ accessToken: string }> {
  await fastify.db.refreshToken.revoke(oldToken.id);

  const user = await fastify.db.user.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const newJti = createJti();
  const newAccessToken = signAccessToken(fastify, user);
  const newRefreshToken = signRefreshToken(fastify, userId, newJti);

  await persistRefreshToken(fastify, {
    userId,
    refreshToken: newRefreshToken,
    jti: newJti,
    ip: request.ip,
  });

  setRefreshCookie(fastify, reply, newRefreshToken);

  return { accessToken: newAccessToken };
}
