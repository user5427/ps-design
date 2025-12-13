import type { FastifyInstance } from "fastify";
import { BadRequestError, NotFoundError, ForbiddenError } from "@/shared/errors";
import { ScopeNames, SCOPE_CONFIG } from "@/modules/user/scope.types";
import type { IAuthUser } from "@/modules/user/user.types";

export async function getAllRoles(
  fastify: FastifyInstance,
  authUser: IAuthUser,
) {
  // Only superadmin can view all roles
  const userScopes = await fastify.db.role.getUserScopesFromRoles(
    authUser.roleIds,
  );

  if (!userScopes.includes(ScopeNames.SUPERADMIN)) {
    throw new ForbiddenError("Only superadmin can view all roles");
  }

  const roles = await fastify.db.role.findAll();

  // Get scopes for each role
  const rolesWithScopes = await Promise.all(
    roles.map(async (role) => {
      const scopes = await fastify.db.roleScope.getScopeNamesForRole(role.id);
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        businessId: role.businessId,
        isSystemRole: role.isSystemRole,
        isDeletable: role.isDeletable,
        scopes,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
      };
    }),
  );

  return rolesWithScopes;
}

export async function getRolesByBusinessId(
  fastify: FastifyInstance,
  businessId: string,
  authUser: IAuthUser,
) {
  // Check if user has access to this business
  const hasOwnerScope = authUser.roleIds.length > 0;
  const userScopes = await fastify.db.role.getUserScopesFromRoles(
    authUser.roleIds,
  );

  if (
    !userScopes.includes(ScopeNames.SUPERADMIN) &&
    authUser.businessId !== businessId
  ) {
    throw new ForbiddenError("You don't have access to this business");
  }

  const roles = await fastify.db.role.findByBusinessId(businessId);

  // Get scopes for each role
  const rolesWithScopes = await Promise.all(
    roles.map(async (role) => {
      const scopes = await fastify.db.roleScope.getScopeNamesForRole(role.id);
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        businessId: role.businessId,
        isSystemRole: role.isSystemRole,
        isDeletable: role.isDeletable,
        scopes,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
      };
    }),
  );

  return rolesWithScopes;
}

export async function getRoleById(
  fastify: FastifyInstance,
  roleId: string,
  authUser: IAuthUser,
) {
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
    authUser.businessId !== role.businessId
  ) {
    throw new ForbiddenError("You don't have access to this role");
  }

  const scopes = await fastify.db.roleScope.getScopeNamesForRole(role.id);

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    businessId: role.businessId,
    isSystemRole: role.isSystemRole,
    isDeletable: role.isDeletable,
    scopes,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

export async function getAvailableScopes(
  fastify: FastifyInstance,
  authUser: IAuthUser,
) {
  // Get user's scopes
  const userScopes = await fastify.db.role.getUserScopesFromRoles(
    authUser.roleIds,
  );

  // If user is superadmin, they can see all scopes
  if (userScopes.includes(ScopeNames.SUPERADMIN)) {
    return Object.values(ScopeNames).map((scope) => ({
      name: scope,
      description: SCOPE_CONFIG[scope].description,
    }));
  }

  // Otherwise, user can only assign scopes they have
  return userScopes.map((scope) => ({
    name: scope,
    description: SCOPE_CONFIG[scope].description,
  }));
}

export async function createRole(
  fastify: FastifyInstance,
  data: {
    name: string;
    description?: string;
    businessId: string;
    scopes: string[];
  },
  authUser: IAuthUser,
) {
  // Check if user has access to this business
  const userScopes = await fastify.db.role.getUserScopesFromRoles(
    authUser.roleIds,
  );

  if (
    !userScopes.includes(ScopeNames.SUPERADMIN) &&
    authUser.businessId !== data.businessId
  ) {
    throw new ForbiddenError("You don't have access to this business");
  }

  // Check if user can assign these scopes
  const isSuperadmin = userScopes.includes(ScopeNames.SUPERADMIN);
  for (const scope of data.scopes) {
    if (!isSuperadmin && !userScopes.includes(scope as ScopeNames)) {
      throw new BadRequestError(
        `You don't have permission to assign scope: ${scope}`,
      );
    }
  }

  // Check if role name already exists in this business
  const existingRole = await fastify.db.role.findByBusinessAndName(
    data.businessId,
    data.name,
  );
  if (existingRole) {
    throw new BadRequestError("Role with this name already exists");
  }

  // Create role
  const role = await fastify.db.role.create({
    name: data.name,
    description: data.description,
    businessId: data.businessId,
    isSystemRole: false,
    isDeletable: true,
  });

  // Assign scopes to role
  for (const scopeName of data.scopes) {
    await fastify.db.roleScope.assignScope(role.id, scopeName as ScopeNames);
  }

  const scopes = await fastify.db.roleScope.getScopeNamesForRole(role.id);

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    businessId: role.businessId,
    isSystemRole: role.isSystemRole,
    isDeletable: role.isDeletable,
    scopes,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

export async function updateRole(
  fastify: FastifyInstance,
  roleId: string,
  data: {
    name?: string;
    description?: string;
  },
  authUser: IAuthUser,
) {
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
    authUser.businessId !== role.businessId
  ) {
    throw new ForbiddenError("You don't have access to this role");
  }

  // Don't allow updating system roles
  if (role.isSystemRole) {
    throw new BadRequestError("Cannot update system role");
  }

  const updatedRole = await fastify.db.role.update(roleId, data);
  if (!updatedRole) {
    throw new NotFoundError("Role not found after update");
  }

  const scopes = await fastify.db.roleScope.getScopeNamesForRole(
    updatedRole.id,
  );

  return {
    id: updatedRole.id,
    name: updatedRole.name,
    description: updatedRole.description,
    businessId: updatedRole.businessId,
    isSystemRole: updatedRole.isSystemRole,
    isDeletable: updatedRole.isDeletable,
    scopes,
    createdAt: updatedRole.createdAt.toISOString(),
    updatedAt: updatedRole.updatedAt.toISOString(),
  };
}

export async function assignScopesToRole(
  fastify: FastifyInstance,
  roleId: string,
  scopes: string[],
  authUser: IAuthUser,
) {
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
    authUser.businessId !== role.businessId
  ) {
    throw new ForbiddenError("You don't have access to this role");
  }

  // Check if user can assign these scopes
  const isSuperadmin = userScopes.includes(ScopeNames.SUPERADMIN);
  for (const scope of scopes) {
    if (!isSuperadmin && !userScopes.includes(scope as ScopeNames)) {
      throw new BadRequestError(
        `You don't have permission to assign scope: ${scope}`,
      );
    }
  }

  // Remove all existing scopes
  await fastify.db.roleScope.removeAllScopes(roleId);

  // Assign new scopes
  for (const scopeName of scopes) {
    await fastify.db.roleScope.assignScope(roleId, scopeName as ScopeNames);
  }

  const updatedScopes = await fastify.db.roleScope.getScopeNamesForRole(roleId);

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    businessId: role.businessId,
    isSystemRole: role.isSystemRole,
    isDeletable: role.isDeletable,
    scopes: updatedScopes,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

export async function deleteRole(
  fastify: FastifyInstance,
  roleId: string,
  authUser: IAuthUser,
) {
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
    authUser.businessId !== role.businessId
  ) {
    throw new ForbiddenError("You don't have access to this role");
  }

  await fastify.db.role.delete(roleId);
}
