import type { FastifyInstance } from "fastify";
import type {
  BusinessResponse,
  CreateBusinessBody,
  UpdateBusinessBody,
  PaginatedBusinessResponse,
  BusinessQuery,
} from "@ps-design/schemas/business";
import { BusinessResponseSchema } from "@ps-design/schemas/business";

export async function getBusinessesPaginated(
  fastify: FastifyInstance,
  query: BusinessQuery,
): Promise<PaginatedBusinessResponse> {
  const result = await fastify.db.business.findAllPaginated(query);
  return {
    items: result.items.map((item) => BusinessResponseSchema.parse(item)),
    metadata: result.metadata,
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
