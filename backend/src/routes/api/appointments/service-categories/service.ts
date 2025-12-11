import type { FastifyInstance } from "fastify";
import type {
  CreateServiceCategoryBody,
  UpdateServiceCategoryBody,
  ServiceCategoryResponse,
} from "@ps-design/schemas/appointments/service-category";
import type { ServiceCategory } from "@/modules/appointments/service-category/service-category.entity";

function toCategoryResponse(
  category: ServiceCategory,
): ServiceCategoryResponse {
  return {
    id: category.id,
    name: category.name,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export async function getAllServiceCategories(
  fastify: FastifyInstance,
  businessId: string,
): Promise<ServiceCategoryResponse[]> {
  const categories =
    await fastify.db.serviceCategory.findAllByBusinessId(businessId);
  return categories.map(toCategoryResponse);
}

export async function createServiceCategory(
  fastify: FastifyInstance,
  businessId: string,
  input: CreateServiceCategoryBody,
): Promise<void> {
  const { name } = input;

  await fastify.db.serviceCategory.create({
    name,
    businessId,
  });
}

export async function getServiceCategoryById(
  fastify: FastifyInstance,
  businessId: string,
  categoryId: string,
): Promise<ServiceCategoryResponse> {
  const category = await fastify.db.serviceCategory.getById(
    categoryId,
    businessId,
  );
  return toCategoryResponse(category);
}

export async function updateServiceCategory(
  fastify: FastifyInstance,
  businessId: string,
  categoryId: string,
  input: UpdateServiceCategoryBody,
): Promise<void> {
  await fastify.db.serviceCategory.update(categoryId, businessId, input);
}

export async function bulkDeleteServiceCategories(
  fastify: FastifyInstance,
  businessId: string,
  ids: string[],
): Promise<void> {
  await fastify.db.serviceCategory.bulkDelete(ids, businessId);
}
