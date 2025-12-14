import type { FastifyInstance } from "fastify";
import type {
  CreateCategoryBody,
  UpdateCategoryBody,
  CategoryResponse,
} from "@ps-design/schemas/category";
import type { Category } from "@/modules/category/category.entity";

function toCategoryResponse(category: Category): CategoryResponse {
  return {
    id: category.id,
    name: category.name,
    businessId: category.businessId,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
    deletedAt: category.deletedAt?.toISOString() ?? null,
  };
}

export async function getAllCategories(
  fastify: FastifyInstance,
  businessId: string,
): Promise<CategoryResponse[]> {
  const categories = await fastify.db.category.findAllByBusinessId(businessId);
  return categories.map(toCategoryResponse);
}

export async function createCategory(
  fastify: FastifyInstance,
  businessId: string,
  input: CreateCategoryBody,
): Promise<CategoryResponse> {
  const { name } = input;

  const category = await fastify.db.category.create({
    name,
    businessId,
  });

  return toCategoryResponse(category);
}

export async function getCategoryById(
  fastify: FastifyInstance,
  businessId: string,
  categoryId: string,
): Promise<CategoryResponse> {
  const category = await fastify.db.category.getById(categoryId, businessId);
  return toCategoryResponse(category);
}

export async function updateCategory(
  fastify: FastifyInstance,
  businessId: string,
  categoryId: string,
  input: UpdateCategoryBody,
): Promise<CategoryResponse> {
  const category = await fastify.db.category.update(
    categoryId,
    businessId,
    input,
  );
  return toCategoryResponse(category);
}

export async function bulkDeleteCategories(
  fastify: FastifyInstance,
  businessId: string,
  ids: string[],
): Promise<void> {
  await fastify.db.category.bulkDelete(ids, businessId);
}
