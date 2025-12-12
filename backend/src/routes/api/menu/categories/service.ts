import type { FastifyInstance } from "fastify";
import type {
  CreateMenuItemCategoryBody,
  UpdateMenuItemCategoryBody,
  MenuItemCategoryResponse,
  PaginatedMenuItemCategoryResponse,
} from "@ps-design/schemas/menu/category";
import { MenuItemCategoryResponseSchema } from "@ps-design/schemas/menu/category";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";
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

export async function getAllCategoriesPaginated(
  fastify: FastifyInstance,
  businessId: string,
  query: UniversalPaginationQuery,
): Promise<PaginatedMenuItemCategoryResponse> {
  const result = await fastify.db.menuItemCategory.findAllPaginated(
    businessId,
    query,
  );
  return {
    items: result.items.map((item: MenuItemCategory) =>
      MenuItemCategoryResponseSchema.parse(toCategoryResponse(item)),
    ),
    metadata: result.metadata,
  };
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
