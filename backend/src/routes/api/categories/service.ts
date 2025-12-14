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
    taxId: category.taxId ?? null,
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

export async function assignTaxToCategory(
  fastify: FastifyInstance,
  businessId: string,
  categoryId: string,
  taxId: string,
): Promise<CategoryResponse> {
  const category = await fastify.db.category.getById(categoryId, businessId);
  const tax = await fastify.db.tax.getById(taxId, businessId);

  if (!tax) {
    throw new Error("Tax not found");
  }

  if (tax.businessId !== businessId) {
    throw new Error("Tax does not belong to the same business");
  }

  category.taxId = taxId;
  const updated = await fastify.db.category.update(
    category.id,
    businessId,
    category,
  );

  return toCategoryResponse(updated);
}

export async function removeTaxFromCategory(
  fastify: FastifyInstance,
  businessId: string,
  categoryId: string,
): Promise<CategoryResponse> {
  const category = await fastify.db.category.getById(categoryId, businessId);
  category.taxId = null;
  const updated = await fastify.db.category.update(
    category.id,
    businessId,
    category,
  );
  return toCategoryResponse(updated);
}
