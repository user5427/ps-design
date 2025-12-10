import type { FastifyInstance } from "fastify";
import type {
  CreateMenuItemCategoryBody,
  UpdateMenuItemCategoryBody,
  MenuItemCategoryResponse,
} from "@ps-design/schemas/menu/category";
import type { MenuItemCategory } from "@/modules/menu/menu-item-category/menu-item-category.entity";

function toCategoryResponse(
  category: MenuItemCategory,
): MenuItemCategoryResponse {
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
): Promise<MenuItemCategoryResponse[]> {
  const categories =
    await fastify.db.menuItemCategory.findAllByBusinessId(businessId);
  return categories.map(toCategoryResponse);
}

export async function createCategory(
  fastify: FastifyInstance,
  businessId: string,
  input: CreateMenuItemCategoryBody,
): Promise<MenuItemCategoryResponse> {
  const { name } = input;

  const category = await fastify.db.menuItemCategory.create({
    name,
    businessId,
  });

  return toCategoryResponse(category);
}

export async function getCategoryById(
  fastify: FastifyInstance,
  businessId: string,
  categoryId: string,
): Promise<MenuItemCategoryResponse> {
  const category = await fastify.db.menuItemCategory.getById(
    categoryId,
    businessId,
  );
  return toCategoryResponse(category);
}

export async function updateCategory(
  fastify: FastifyInstance,
  businessId: string,
  categoryId: string,
  input: UpdateMenuItemCategoryBody,
): Promise<MenuItemCategoryResponse> {
  const updated = await fastify.db.menuItemCategory.update(
    categoryId,
    businessId,
    input,
  );
  return toCategoryResponse(updated);
}

export async function bulkDeleteCategories(
  fastify: FastifyInstance,
  businessId: string,
  ids: string[],
): Promise<void> {
  await fastify.db.menuItemCategory.bulkDelete(ids, businessId);
}
