import type { FastifyInstance } from "fastify";
import type {
  CreateMenuItemBody,
  UpdateMenuItemBody,
  MenuItemResponse,
  MenuItemVariationResponse,
  ProductRecipeResponse,
} from "@ps-design/schemas/menu/items";
import type { MenuItem } from "@/modules/menu/menu-item/menu-item.entity";
import type { MenuItemVariation } from "@/modules/menu/menu-item-variation/menu-item-variation.entity";
import type { MenuItemBaseProduct } from "@/modules/menu/menu-item-base-product/menu-item-base-product.entity";
import type { MenuItemVariationProduct } from "@/modules/menu/menu-item-variation-product/menu-item-variation-product.entity";

function toProductRecipeResponse(
  recipe: MenuItemBaseProduct | MenuItemVariationProduct,
): ProductRecipeResponse {
  return {
    id: recipe.id,
    quantity: recipe.quantity,
    product: {
      id: recipe.product.id,
      name: recipe.product.name,
      productUnit: {
        id: recipe.product.productUnit.id,
        name: recipe.product.productUnit.name,
        symbol: recipe.product.productUnit.symbol,
      },
    },
  };
}

function toVariationResponse(
  variation: MenuItemVariation,
  isAvailable: boolean,
): MenuItemVariationResponse {
  return {
    id: variation.id,
    name: variation.name,
    type: variation.type,
    priceAdjustment: variation.priceAdjustment,
    isDisabled: variation.isDisabled,
    isAvailable,
    addonProducts: variation.addonProducts?.map(toProductRecipeResponse) ?? [],
    createdAt: variation.createdAt.toISOString(),
    updatedAt: variation.updatedAt.toISOString(),
    deletedAt: variation.deletedAt?.toISOString() ?? null,
  };
}

/**
 * Check if there's enough stock for a list of product requirements.
 * Takes into account cumulative requirements (base + addon products).
 */
function checkRecipeAvailability(
  requirements: Array<{ productId: string; quantity: number }>,
  stockMap: Map<string, number>,
): boolean {
  const requiredQuantities = new Map<string, number>();
  for (const req of requirements) {
    const current = requiredQuantities.get(req.productId) ?? 0;
    requiredQuantities.set(req.productId, current + req.quantity);
  }

  for (const [productId, requiredQty] of requiredQuantities) {
    const stockQty = stockMap.get(productId) ?? 0;
    if (stockQty < requiredQty) {
      return false;
    }
  }

  return true;
}

function toMenuItemResponse(
  menuItem: MenuItem,
  stockMap: Map<string, number>,
): MenuItemResponse {
  // Get base product requirements
  const baseRequirements =
    menuItem.baseProducts?.map((bp) => ({
      productId: bp.productId,
      quantity: bp.quantity,
    })) ?? [];

  const baseProductsAvailable = checkRecipeAvailability(
    baseRequirements,
    stockMap,
  );

  // Calculate variation availability
  // Each variation needs base products + its addon products
  const variationsWithAvailability =
    menuItem.variations
      ?.filter((v) => !v.deletedAt)
      ?.map((variation) => {
        const addonRequirements =
          variation.addonProducts?.map((ap) => ({
            productId: ap.productId,
            quantity: ap.quantity,
          })) ?? [];

        const totalRequirements = [...baseRequirements, ...addonRequirements];
        const variationAvailable = checkRecipeAvailability(
          totalRequirements,
          stockMap,
        );

        return toVariationResponse(variation, variationAvailable);
      }) ?? [];

  const isAvailable = !menuItem.isDisabled && baseProductsAvailable;

  return {
    id: menuItem.id,
    baseName: menuItem.baseName,
    basePrice: menuItem.basePrice,
    categoryId: menuItem.categoryId,
    businessId: menuItem.businessId,
    isDisabled: menuItem.isDisabled,
    isAvailable,
    category: menuItem.category
      ? {
          id: menuItem.category.id,
          name: menuItem.category.name,
        }
      : null,
    baseProducts: menuItem.baseProducts?.map(toProductRecipeResponse) ?? [],
    variations: variationsWithAvailability,
    createdAt: menuItem.createdAt.toISOString(),
    updatedAt: menuItem.updatedAt.toISOString(),
    deletedAt: menuItem.deletedAt?.toISOString() ?? null,
  };
}

async function getStockMap(
  fastify: FastifyInstance,
  menuItems: MenuItem[],
  businessId: string,
): Promise<Map<string, number>> {
  const allProductIds = new Set<string>();

  for (const menuItem of menuItems) {
    for (const bp of menuItem.baseProducts ?? []) {
      allProductIds.add(bp.productId);
    }

    for (const variation of menuItem.variations ?? []) {
      for (const ap of variation.addonProducts ?? []) {
        allProductIds.add(ap.productId);
      }
    }
  }

  return fastify.db.menuItem.getProductStockLevels(
    Array.from(allProductIds),
    businessId,
  );
}

export async function getAllMenuItems(
  fastify: FastifyInstance,
  businessId: string,
): Promise<MenuItemResponse[]> {
  const menuItems = await fastify.db.menuItem.findAllByBusinessId(businessId);
  const stockMap = await getStockMap(fastify, menuItems, businessId);
  return menuItems.map((item) => toMenuItemResponse(item, stockMap));
}

export async function createMenuItem(
  fastify: FastifyInstance,
  businessId: string,
  input: CreateMenuItemBody,
): Promise<MenuItemResponse> {
  const menuItem = await fastify.db.menuItem.create({
    baseName: input.baseName,
    basePrice: input.basePrice,
    categoryId: input.categoryId ?? null,
    isDisabled: input.isDisabled ?? false,
    businessId,
    baseProducts: input.baseProducts ?? [],
    variations:
      input.variations?.map((v) => ({
        name: v.name,
        type: v.type,
        priceAdjustment: v.priceAdjustment ?? 0,
        isDisabled: v.isDisabled ?? false,
        addonProducts: v.addonProducts ?? [],
      })) ?? [],
  });

  const stockMap = await getStockMap(fastify, [menuItem], businessId);
  return toMenuItemResponse(menuItem, stockMap);
}

export async function getMenuItemById(
  fastify: FastifyInstance,
  businessId: string,
  menuItemId: string,
): Promise<MenuItemResponse> {
  const menuItem = await fastify.db.menuItem.getById(menuItemId, businessId);
  const stockMap = await getStockMap(fastify, [menuItem], businessId);
  return toMenuItemResponse(menuItem, stockMap);
}

export async function updateMenuItem(
  fastify: FastifyInstance,
  businessId: string,
  menuItemId: string,
  input: UpdateMenuItemBody,
): Promise<MenuItemResponse> {
  const updated = await fastify.db.menuItem.update(menuItemId, businessId, {
    baseName: input.baseName,
    basePrice: input.basePrice,
    categoryId: input.categoryId,
    isDisabled: input.isDisabled,
    baseProducts: input.baseProducts,
    variations: input.variations,
    removeVariationIds: input.removeVariationIds,
  });

  const stockMap = await getStockMap(fastify, [updated], businessId);
  return toMenuItemResponse(updated, stockMap);
}

export async function bulkDeleteMenuItems(
  fastify: FastifyInstance,
  businessId: string,
  ids: string[],
): Promise<void> {
  await fastify.db.menuItem.bulkDelete(ids, businessId);
}
