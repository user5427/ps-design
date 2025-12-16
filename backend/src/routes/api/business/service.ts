import type { FastifyInstance } from "fastify";
import type {
  BusinessResponse,
  CreateBusinessBody,
  UpdateBusinessBody,
  PaginatedBusinessResponse,
  BusinessUserResponse,
} from "@ps-design/schemas/business";
import { BusinessResponseSchema } from "@ps-design/schemas/business";
import { ScopeNames } from "@/modules/user";
import { BadRequestError } from "@/shared/errors";

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
  const { name, email, phone, address } = input;
  const business = await fastify.db.business.create({ 
    name, 
    email, 
    phone, 
    address 
  });

  // Create default OWNER role for the new business
  const ownerRole = await fastify.db.role.create({
    name: "OWNER",
    description: "Business owner with full permissions",
    businessId: business.id,
    isSystemRole: true,
    isDeletable: false,
  });

  // Assign owner scopes to the role
  const ownerScopes = Object.values(ScopeNames).filter(
    (scope) => scope !== ScopeNames.SUPERADMIN,
  );

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
