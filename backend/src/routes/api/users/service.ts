import type { FastifyInstance } from "fastify";
import * as bcrypt from "bcryptjs";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "@/shared/errors";
import { ScopeNames } from "@/modules/user/scope.types";
import type { IAuthUser } from "@/modules/user/user.types";

export async function getUsersByBusinessId(
  fastify: FastifyInstance,
  businessId: string | undefined,
  authUser: IAuthUser,
) {
  const userScopes = await fastify.db.role.getUserScopesFromRoles(
    authUser.roleIds,
  );

  let targetBusinessId = businessId;

  // If superadmin and no businessId specified, return all users
  if (userScopes.includes(ScopeNames.SUPERADMIN) && !businessId) {
    const users = await fastify.db.user.findAll();
    return Promise.all(
      users.map(async (user) => {
        const userRoles = await fastify.db.userRole.getRolesForUser(user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          businessId: user.businessId,
          businessName: user.business.name,
          roles: await Promise.all(
            userRoles.map(async (ur) => ({
              id: ur.role.id,
              name: ur.role.name,
              description: ur.role.description,
            })),
          ),
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        };
      }),
    );
  }

  // If owner, use their business
  if (!targetBusinessId) {
    if (!authUser.businessId) {
      throw new BadRequestError("Business ID is required");
    }
    targetBusinessId = authUser.businessId;
  }

  // Check if user has access to this business
  if (
    !userScopes.includes(ScopeNames.SUPERADMIN) &&
    authUser.businessId !== targetBusinessId
  ) {
    throw new ForbiddenError("You don't have access to this business");
  }

  const users = await fastify.db.user.findByBusinessId(targetBusinessId);

  return Promise.all(
    users.map(async (user) => {
      const userRoles = await fastify.db.userRole.getRolesForUser(user.id);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        businessId: user.businessId,
        businessName: user.business?.name ?? null,
        roles: await Promise.all(
          userRoles.map(async (ur) => ({
            id: ur.role.id,
            name: ur.role.name,
            description: ur.role.description,
          })),
        ),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    }),
  );
}

export async function getUserById(
  fastify: FastifyInstance,
  userId: string,
  authUser: IAuthUser,
) {
  const user = await fastify.db.user.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Check if user has access
  const userScopes = await fastify.db.role.getUserScopesFromRoles(
    authUser.roleIds,
  );

  if (
    !userScopes.includes(ScopeNames.SUPERADMIN) &&
    authUser.businessId !== user.businessId &&
    authUser.id !== userId
  ) {
    throw new ForbiddenError("You don't have access to this user");
  }

  const userRoles = await fastify.db.userRole.getRolesForUser(user.id);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    businessId: user.businessId,
    businessName: user.business?.name ?? null,
    roles: await Promise.all(
      userRoles.map(async (ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
    ),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function createUser(
  fastify: FastifyInstance,
  data: {
    email: string;
    name: string;
    password: string;
    businessId: string;
    isOwner?: boolean;
  },
  _authUser: IAuthUser,
) {
  // Check if email already exists
  const existing = await fastify.db.user.findByEmail(data.email);
  if (existing) {
    throw new BadRequestError("User with this email already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create user
  const user = await fastify.db.user.create({
    email: data.email,
    name: data.name,
    passwordHash,
    businessId: data.businessId,
  });

  // If isOwner is true, assign owner role
  if (data.isOwner) {
    const ownerRole = await fastify.db.role.findByBusinessAndName(
      data.businessId,
      "OWNER",
    );
    if (ownerRole) {
      await fastify.db.userRole.assignRole(user.id, ownerRole.id);
    }
  }

  const userRoles = await fastify.db.userRole.getRolesForUser(user.id);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    businessId: user.businessId,
    businessName: user.business?.name ?? null,
    roles: await Promise.all(
      userRoles.map(async (ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
    ),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function assignRolesToUser(
  fastify: FastifyInstance,
  userId: string,
  roleIds: string[],
  authUser: IAuthUser,
) {
  const user = await fastify.db.user.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Check if user has access to this business
  const userScopes = await fastify.db.role.getUserScopesFromRoles(
    authUser.roleIds,
  );

  if (
    !userScopes.includes(ScopeNames.SUPERADMIN) &&
    authUser.businessId !== user.businessId
  ) {
    throw new ForbiddenError("You don't have access to this user");
  }

  // Verify all roles belong to the same business
  for (const roleId of roleIds) {
    const role = await fastify.db.role.findById(roleId);
    if (!role) {
      throw new NotFoundError(`Role ${roleId} not found`);
    }
    if (role.businessId !== user.businessId) {
      throw new BadRequestError(
        "Cannot assign roles from different businesses",
      );
    }

    // Check if user can assign this role (must have all scopes in the role)
    if (!userScopes.includes(ScopeNames.SUPERADMIN)) {
      const roleScopes =
        await fastify.db.roleScope.getScopeNamesForRole(roleId);
      for (const scope of roleScopes) {
        if (!userScopes.includes(scope)) {
          throw new ForbiddenError(
            `You don't have permission to assign role with scope: ${scope}`,
          );
        }
      }
    }
  }

  // Remove all existing roles
  await fastify.db.userRole.removeAllRoles(userId);

  // Assign new roles
  for (const roleId of roleIds) {
    await fastify.db.userRole.assignRole(userId, roleId);
  }

  const userRoles = await fastify.db.userRole.getRolesForUser(user.id);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    businessId: user.businessId,
    businessName: user.business?.name ?? null,
    roles: await Promise.all(
      userRoles.map(async (ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
    ),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function removeRoleFromUser(
  fastify: FastifyInstance,
  userId: string,
  roleId: string,
  authUser: IAuthUser,
) {
  const user = await fastify.db.user.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const role = await fastify.db.role.findById(roleId);
  if (!role) {
    throw new NotFoundError("Role not found");
  }

  // Check if user has access to this business
  const userScopes = await fastify.db.role.getUserScopesFromRoles(
    authUser.roleIds,
  );

  if (
    !userScopes.includes(ScopeNames.SUPERADMIN) &&
    authUser.businessId !== user.businessId
  ) {
    throw new ForbiddenError("You don't have access to this user");
  }

  // Check if this is a SUPERADMIN role
  if (role.name === "SUPERADMIN") {
    // Prevent removing the last superadmin globally
    const allUsersWithRole = await fastify.db.userRole.getUsersWithRole(roleId);
    if (allUsersWithRole.length <= 1) {
      throw new BadRequestError(
        "Cannot remove the last superadmin from the system",
      );
    }
  }

  // Check if this is an OWNER role
  if (role.name === "OWNER") {
    // Allow SUPERADMIN to remove last owner, but prevent others from doing so
    if (!userScopes.includes(ScopeNames.SUPERADMIN)) {
      // Prevent removing the last owner from the business
      const allUsersWithRole =
        await fastify.db.userRole.getUsersWithRole(roleId);
      // Filter to only users in the same business
      const businessOwners = allUsersWithRole.filter(
        (ur) => ur.user.businessId === user.businessId,
      );
      if (businessOwners.length <= 1) {
        throw new BadRequestError(
          "Cannot remove the last owner from the business",
        );
      }
    }
  }

  await fastify.db.userRole.removeRole(userId, roleId);
}

export async function updateUser(
  fastify: FastifyInstance,
  userId: string,
  data: { email?: string; name?: string },
  authUser: IAuthUser,
) {
  const user = await fastify.db.user.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Check if user has access
  const userScopes = await fastify.db.role.getUserScopesFromRoles(
    authUser.roleIds,
  );

  if (
    !userScopes.includes(ScopeNames.SUPERADMIN) &&
    authUser.businessId !== user.businessId
  ) {
    throw new ForbiddenError("You don't have access to this user");
  }

  // Check if email already exists (if changing email)
  if (data.email && data.email !== user.email) {
    const existing = await fastify.db.user.findByEmail(data.email);
    if (existing) {
      throw new BadRequestError("User with this email already exists");
    }
  }

  // Update user
  const updatedUser = await fastify.db.user.update(userId, data);
  if (!updatedUser) {
    throw new NotFoundError("User not found");
  }

  const userRoles = await fastify.db.userRole.getRolesForUser(updatedUser.id);

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    businessId: updatedUser.businessId,
    businessName: updatedUser.business?.name ?? null,
    roles: await Promise.all(
      userRoles.map(async (ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
      })),
    ),
    createdAt: updatedUser.createdAt.toISOString(),
    updatedAt: updatedUser.updatedAt.toISOString(),
  };
}

export async function deleteUser(
  fastify: FastifyInstance,
  userId: string,
  authUser: IAuthUser,
) {
  const user = await fastify.db.user.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Check if user has access
  const userScopes = await fastify.db.role.getUserScopesFromRoles(
    authUser.roleIds,
  );

  if (
    !userScopes.includes(ScopeNames.SUPERADMIN) &&
    authUser.businessId !== user.businessId
  ) {
    throw new ForbiddenError("You don't have access to this user");
  }

  // Don't allow users to delete themselves
  if (userId === authUser.id) {
    throw new BadRequestError("You cannot delete your own account");
  }

  // Remove all user roles first
  await fastify.db.userRole.removeAllRoles(userId);

  // Delete user
  await fastify.db.user.softDelete(userId);
}
