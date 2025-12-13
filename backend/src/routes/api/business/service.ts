import type { FastifyInstance } from "fastify";
import type {
  BusinessResponse,
  CreateBusinessBody,
  UpdateBusinessBody,
  PaginatedBusinessResponse,
  BusinessUserResponse,
} from "@ps-design/schemas/business";
import { BusinessResponseSchema } from "@ps-design/schemas/business";

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
  if (authUser && authUser.businessId) {
    const userScopes = await fastify.db.role.getUserScopesFromRoles(
      authUser.roleIds,
    );
    
    if (!userScopes.includes("SUPERADMIN")) {
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
