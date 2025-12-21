import type { FastifyInstance } from "fastify";
import type {
  BusinessResponse,
  CreateBusinessBody,
  UpdateBusinessBody,
  UpdateBusinessTypesBody,
  PaginatedBusinessResponse,
  BusinessUserResponse,
  AdvancedPaginatedBusinessResponse,
} from "@ps-design/schemas/business";
import { BusinessResponseSchema } from "@ps-design/schemas/business";
import { ScopeNames, SCOPE_CONFIG } from "@/modules/user";
import { BadRequestError } from "@/shared/errors";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";

export async function getBusinessesPaginatedAdvanced(
  fastify: FastifyInstance,
  query: UniversalPaginationQuery,
): Promise<AdvancedPaginatedBusinessResponse> {
  const result = await fastify.db.business.findAllPaginatedAdvanced(query);
  return result;
}

export async function getBusinessesPaginated(
  fastify: FastifyInstance,
  page: number,
  limit: number,
  search?: string,
  authUser?: any,
): Promise<PaginatedBusinessResponse> {
  const result = await fastify.db.business.findAllPaginated(
    page,
    limit,
    search,
  );

  let items = result.items;

  // If user is not superadmin, filter to only show their business
  if (authUser?.businessId) {
    const userScopes = await fastify.db.role.getUserScopesFromRoles(
      authUser.roleIds,
    );

    if (!userScopes.includes(ScopeNames.SUPERADMIN)) {
      items = items.filter((item) => item.id === authUser.businessId);
    }
  }

  return {
    items: items.map((item) => BusinessResponseSchema.parse(item)),
    total: items.length,
    page: page,
    limit: limit,
    pages: Math.ceil(items.length / limit),
  };
}

export async function createBusiness(
  fastify: FastifyInstance,
  input: CreateBusinessBody,
): Promise<BusinessResponse> {
  const {
    name,
    email,
    phone,
    address,
    isOrderBased = true,
    isAppointmentBased = true,
  } = input;
  const business = await fastify.db.business.create({
    name,
    email,
    phone,
    address,
    isOrderBased,
    isAppointmentBased,
  });

  // Create default OWNER role for the new business
  const ownerRole = await fastify.db.role.create({
    name: "OWNER",
    description: "Business owner with full permissions",
    businessId: business.id,
    isSystemRole: true,
    isDeletable: false,
  });

  // Filter scopes based on business types
  const ownerScopes = Object.values(ScopeNames).filter((scope) => {
    // Always exclude SUPERADMIN
    if (scope === ScopeNames.SUPERADMIN) {
      return false;
    }

    const scopeConfig = SCOPE_CONFIG[scope];

    // If scope has no business type restriction, include it
    if (!scopeConfig.businessType) {
      return true;
    }

    // Include scope if business type matches
    if (scopeConfig.businessType === "order" && isOrderBased) {
      return true;
    }

    if (scopeConfig.businessType === "appointment" && isAppointmentBased) {
      return true;
    }

    return false;
  });

  for (const scopeName of ownerScopes) {
    await fastify.db.roleScope.assignScope(ownerRole.id, scopeName as any);
  }

  return BusinessResponseSchema.parse(business);
}

export async function getBusinessById(
  fastify: FastifyInstance,
  businessId: string,
  authUser?: any,
): Promise<BusinessResponse> {
  // Check if user has access to this business
  if (authUser) {
    const userScopes = await fastify.db.role.getUserScopesFromRoles(
      authUser.roleIds,
    );

    // If user is not superadmin, verify they belong to this business
    if (!userScopes.includes(ScopeNames.SUPERADMIN)) {
      if (authUser.businessId !== businessId) {
        throw new BadRequestError(
          "You do not have permission to access this business",
        );
      }
    }
  }

  const business = await fastify.db.business.getById(businessId);
  return BusinessResponseSchema.parse(business);
}

export async function updateBusiness(
  fastify: FastifyInstance,
  businessId: string,
  input: UpdateBusinessBody,
  authUser?: any,
): Promise<BusinessResponse> {
  // Check if user has access to this business
  if (authUser) {
    const userScopes = await fastify.db.role.getUserScopesFromRoles(
      authUser.roleIds,
    );

    // If user is not superadmin, verify they belong to this business
    if (!userScopes.includes(ScopeNames.SUPERADMIN)) {
      if (authUser.businessId !== businessId) {
        throw new BadRequestError(
          "You do not have permission to update this business",
        );
      }
    }
  }

  const updated = await fastify.db.business.update(businessId, input);
  return BusinessResponseSchema.parse(updated);
}

export async function deleteBusiness(
  fastify: FastifyInstance,
  businessId: string,
): Promise<void> {
  await fastify.db.business.softDelete(businessId);

  const connectedUsers = await fastify.db.user.findByBusinessId(businessId);
  for (const user of connectedUsers) {
    await fastify.db.refreshToken.revokeAllByUserId(user.id);
  }
}

export async function getBusinessUsers(
  fastify: FastifyInstance,
  businessId: string,
): Promise<BusinessUserResponse[]> {
  const users = await fastify.db.user.findByBusinessId(businessId);
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
  }));
}

export async function updateBusinessTypes(
  fastify: FastifyInstance,
  businessId: string,
  input: UpdateBusinessTypesBody,
): Promise<BusinessResponse> {
  const updated = await fastify.db.business.updateBusinessTypes(
    businessId,
    input,
  );

  // Get all roles for this business
  const allRoles = await fastify.db.role.findByBusinessId(businessId);

  // Determine which scopes should be removed from ALL roles
  const scopesToRemoveFromAll: ScopeNames[] = [];

  // If order-based is disabled, remove all order scopes
  if (!updated.isOrderBased) {
    Object.values(ScopeNames).forEach((scope) => {
      const scopeConfig = SCOPE_CONFIG[scope];
      if (scopeConfig.businessType === "order") {
        scopesToRemoveFromAll.push(scope);
      }
    });
  }

  // If appointment-based is disabled, remove all appointment scopes
  if (!updated.isAppointmentBased) {
    Object.values(ScopeNames).forEach((scope) => {
      const scopeConfig = SCOPE_CONFIG[scope];
      if (scopeConfig.businessType === "appointment") {
        scopesToRemoveFromAll.push(scope);
      }
    });
  }

  // Remove scopes from ALL roles in the business
  for (const role of allRoles) {
    const currentScopes = await fastify.db.roleScope.getScopeNamesForRole(
      role.id,
    );

    // Do not modify roles that have SUPERADMIN scope
    if (currentScopes.includes(ScopeNames.SUPERADMIN)) {
      continue;
    }

    for (const scopeName of scopesToRemoveFromAll) {
      if (currentScopes.includes(scopeName)) {
        await fastify.db.roleScope.removeScope(role.id, scopeName);
      }
    }
  }

  // Now handle OWNER role - add back scopes for enabled business types
  const ownerRole = await fastify.db.role.findByBusinessAndName(
    businessId,
    "OWNER",
  );

  if (ownerRole) {
    // Get current scopes for owner role
    const currentOwnerScopes = await fastify.db.roleScope.getScopeNamesForRole(
      ownerRole.id,
    );

    // Calculate what scopes OWNER should have based on business types
    const targetOwnerScopes = Object.values(ScopeNames).filter((scope) => {
      // Always exclude SUPERADMIN
      if (scope === ScopeNames.SUPERADMIN) {
        return false;
      }

      const scopeConfig = SCOPE_CONFIG[scope];

      // If scope has no business type restriction, include it
      if (!scopeConfig.businessType) {
        return true;
      }

      // Include scope if business type matches
      if (scopeConfig.businessType === "order" && updated.isOrderBased) {
        return true;
      }

      if (
        scopeConfig.businessType === "appointment" &&
        updated.isAppointmentBased
      ) {
        return true;
      }

      return false;
    });

    // Add missing scopes to OWNER role only
    for (const scopeName of targetOwnerScopes) {
      if (!currentOwnerScopes.includes(scopeName)) {
        await fastify.db.roleScope.assignScope(ownerRole.id, scopeName);
      }
    }
  }

  return BusinessResponseSchema.parse(updated);
}
