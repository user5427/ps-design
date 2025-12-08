import * as bcrypt from "bcryptjs";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import httpStatus from "http-status";
import {
  createJti,
  hashToken,
  persistRefreshToken,
  rotateRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "@/shared/auth-utils";
import {
  type AuthResponse,
  AuthResponseSchema,
  type RefreshResponse,
  RefreshResponseSchema,
  type ChangePasswordBody,
  type LoginBody,
} from "@ps-design/schemas/auth";

const SALT_LENGTH = 10;

export async function login(
  fastify: FastifyInstance,
  request: FastifyRequest,
  input: LoginBody,
): Promise<AuthResponse> {
  const { email, password } = input;

  const user = await fastify.db.user.findByEmail(email);

  if (!user) {
    throw {
      code: httpStatus.UNAUTHORIZED,
      message: "Unauthorized",
    };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw {
      code: httpStatus.UNAUTHORIZED,
      message: "Unauthorized",
    };
  }

  const accessToken = signAccessToken(fastify, user);

  const jti = createJti();
  const refreshToken = signRefreshToken(fastify, user.id, jti);

  await persistRefreshToken(fastify, {
    userId: user.id,
    refreshToken,
    jti,
    ip: request.ip,
  });

  return AuthResponseSchema.parse({ ...user, accessToken, refreshToken });
}

export async function logout(
  fastify: FastifyInstance,
  request: FastifyRequest,
): Promise<void> {
  const token = request.cookies.refresh_token;
  if (token) {
    const tokenHash = hashToken(token);
    const tokenDoc = await fastify.db.refreshToken.findByTokenHash(tokenHash);

    if (tokenDoc && !tokenDoc.revokedAt) {
      await fastify.db.refreshToken.revoke(tokenDoc.id);
    }
  }
}

export async function changePassword(
  fastify: FastifyInstance,
  userId: string,
  input: ChangePasswordBody,
): Promise<void> {
  const { currentPassword, newPassword } = input;

  const dbUser = await fastify.db.user.findById(userId);

  if (!dbUser) {
    throw {
      code: httpStatus.UNAUTHORIZED,
      message: "Unauthorized",
    };
  }

  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!valid) {
    throw {
      code: httpStatus.UNAUTHORIZED,
      message: "Unauthorized",
    };
  }

  const newHash = await bcrypt.hash(newPassword, SALT_LENGTH);

  await fastify.db.user.update(userId, {
    passwordHash: newHash,
    isPasswordResetRequired: false,
  });
}

export async function refreshAccessToken(
  fastify: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<RefreshResponse> {
  const token = request.cookies.refresh_token;
  if (!token) {
    throw {
      code: httpStatus.UNAUTHORIZED,
      message: "No refresh token",
    };
  }

  let decoded: { userId: string; jti: string };
  try {
    decoded = await fastify.jwt.verify(token, {
      key: fastify.config.REFRESH_TOKEN_SECRET,
    });
  } catch (err) {
    throw {
      code: httpStatus.UNAUTHORIZED,
      message: "Invalid or expired refresh token",
    };
  }

  const tokenHash = hashToken(token);
  const tokenDoc = await fastify.db.refreshToken.findByTokenHash(tokenHash);

  if (!tokenDoc) {
    throw {
      code: httpStatus.UNAUTHORIZED,
      message: "Refresh token not recognized",
    };
  }

  if (tokenDoc.jti !== decoded.jti) {
    throw {
      code: httpStatus.UNAUTHORIZED,
      message: "Token ID mismatch",
    };
  }

  if (tokenDoc.revokedAt) {
    throw {
      code: httpStatus.UNAUTHORIZED,
      message: "Refresh token revoked",
    };
  }

  if (tokenDoc.expiresAt < new Date()) {
    throw {
      code: httpStatus.UNAUTHORIZED,
      message: "Refresh token expired",
    };
  }

  const result = await rotateRefreshToken(
    fastify,
    tokenDoc,
    decoded.userId,
    request,
    reply,
  );

  return RefreshResponseSchema.parse(result);
}
