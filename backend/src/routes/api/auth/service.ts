import * as bcrypt from "bcryptjs";
import * as crypto from "node:crypto";
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

  const businessDeleted = await fastify.db.business.isDeleted(user?.businessId);
  if (businessDeleted) {
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
  } catch (_err) {
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

export async function impersonateBusiness(
  fastify: FastifyInstance,
  request: FastifyRequest,
  businessId: string,
  superadminId: string,
): Promise<AuthResponse> {
  // Verify the business exists
  const business = await fastify.db.business.findById(businessId);
  if (!business) {
    throw {
      code: httpStatus.NOT_FOUND,
      message: "Business not found",
    };
  }

  // Check if user already has an active temp session and clean it up
  const existingSession =
    await fastify.db.userTempSession.findByOriginalUserId(superadminId);
  if (existingSession) {
    // Clean up the old temp user
    await cleanupTempUser(fastify, existingSession.tempUserId);
    await fastify.db.userTempSession.deleteByOriginalUserId(superadminId);
  }

  // Generate random password for temp user
  const tempPassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(tempPassword, SALT_LENGTH);

  // Create temporary user
  const tempUser = await fastify.db.user.create({
    email: `temp_${superadminId}_${Date.now()}@temp.local`,
    passwordHash,
    name: "Temporary Admin User",
    isPasswordResetRequired: false,
    isTempUser: true,
    businessId,
  });

  // Get all scopes from the superadmin user
  const superadminScopes = await fastify.db.role.getUserScopesFromRoles(
    (await fastify.db.userRole.getRoleIdsForUser(superadminId)),
  );
  
  if (!superadminScopes.length) {
    throw {
      code: httpStatus.UNAUTHORIZED,
      message: "Superadmin has no scopes",
    };
  }

  // Create a temporary role with all superadmin scopes
  const tempRole = await fastify.db.role.create({
    name: `TEMP_ADMIN_${Date.now()}`,
    description: "Temporary admin role for business impersonation",
    businessId,
    isSystemRole: false,
    isDeletable: true,
  });

  // Assign all scopes from superadmin to temp role
  for (const scopeName of superadminScopes) {
    await fastify.db.roleScope.assignScope(tempRole.id, scopeName);
  }

  // Assign role to temp user
  await fastify.db.userRole.assignRole(tempUser.id, tempRole.id);

  // Create temp session tracking
  await fastify.db.userTempSession.create({
    originalUserId: superadminId,
    tempUserId: tempUser.id,
  });

  // Generate tokens
  const accessToken = signAccessToken(fastify, tempUser);
  const jti = createJti();
  const refreshToken = signRefreshToken(fastify, tempUser.id, jti);

  await persistRefreshToken(fastify, {
    userId: tempUser.id,
    refreshToken,
    jti,
    ip: request.ip,
  });

  return AuthResponseSchema.parse({
    id: tempUser.id,
    email: tempUser.email,
    businessId: tempUser.businessId,
    isPasswordResetRequired: false,
    accessToken,
    refreshToken,
  });
}

async function cleanupTempUser(
  fastify: FastifyInstance,
  tempUserId: string,
): Promise<void> {
  // Delete all refresh tokens for temp user
  await fastify.db.refreshToken.revokeAllByUserId(tempUserId);

  // Find and delete temp role
  const userRoles = await fastify.db.userRole.findByUserId(tempUserId);
  for (const userRole of userRoles) {
    const role = await fastify.db.role.findById(userRole.roleId);
    if (role && role.name.startsWith("TEMP_ADMIN_")) {
      await fastify.db.role.delete(role.id);
    }
  }

  // Delete temp user
  await fastify.db.user.hardDelete(tempUserId);
}

export async function endImpersonation(
  fastify: FastifyInstance,
  userId: string,
): Promise<void> {
  const user = await fastify.db.user.findById(userId);
  
  if (!user || !user.isTempUser) {
    throw {
      code: httpStatus.BAD_REQUEST,
      message: "Not an impersonation session",
    };
  }

  // Clean up temp user
  await cleanupTempUser(fastify, userId);

  // Delete temp session tracking
  await fastify.db.userTempSession.deleteByTempUserId(userId);
}
