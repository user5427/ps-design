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
  const { name } = input;
  const business = await fastify.db.business.create({ name });
  
  // Create default OWNER role for the new business
  const ownerRole = await fastify.db.role.create({
    name: "OWNER",
    description: "Business owner with full permissions",
    businessId: business.id,
    isSystemRole: true,
    isDeletable: false,
  });
  
  // Assign owner scopes to the role
  const ownerScopes = [
    "OWNER",
    "USER_READ",
    "USER_WRITE",
    "USER_DELETE",
    "ROLE_READ",
    "ROLE_WRITE",
    "ROLE_DELETE",
    "INVENTORY_READ",
    "INVENTORY_WRITE",
    "INVENTORY_DELETE",
    "MENU_READ",
    "MENU_WRITE",
    "MENU_DELETE",
    "BUSINESS_READ",
    "BUSINESS_WRITE",
    "APPOINTMENTS_READ",
    "APPOINTMENTS_WRITE",
    "APPOINTMENTS_DELETE",
  ];
  
  for (const scopeName of ownerScopes) {
    await fastify.db.roleScope.assignScope(ownerRole.id, scopeName as any);
  }
  
  return BusinessResponseSchema.parse(business);
}

export async function getBusinessById(
  fastify: FastifyInstance,
  businessId: string,
): Promise<BusinessResponse> {
  const business = await fastify.db.business.getById(businessId);
  return BusinessResponseSchema.parse(business);
}

export async function updateBusiness(
  fastify: FastifyInstance,
  businessId: string,
  input: UpdateBusinessBody,
): Promise<BusinessResponse> {
  const updated = await fastify.db.business.update(businessId, input);
  return BusinessResponseSchema.parse(updated);
}

export async function deleteBusiness(
  fastify: FastifyInstance,
  businessId: string,
): Promise<void> {
  await fastify.db.business.softDelete(businessId);
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
