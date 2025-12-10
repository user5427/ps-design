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

async function toMenuItemResponse(
  fastify: FastifyInstance,
  menuItem: MenuItem,
): Promise<MenuItemResponse> {
  const allProductIds = new Set<string>();

  for (const bp of menuItem.baseProducts ?? []) {
    allProductIds.add(bp.productId);
  }

  for (const variation of menuItem.variations ?? []) {
    for (const ap of variation.addonProducts ?? []) {
      allProductIds.add(ap.productId);
    }
  }

  // Check availability for all products

  const availabilityMap = await fastify.db.menuItem.checkProductsAvailability(
    Array.from(allProductIds),
    menuItem.businessId,
  );

  const baseProductsAvailable =
    menuItem.baseProducts?.length === 0 ||
    menuItem.baseProducts?.every((bp) => availabilityMap.get(bp.productId)) ===
      true;

  // Calculate variation availability (variation addon products must be available)
  const variationsWithAvailability =
    menuItem.variations
      ?.filter((v) => !v.deletedAt)
      ?.map((variation) => {
        const addonProductsAvailable =
          variation.addonProducts?.length === 0 ||
          variation.addonProducts?.every((ap) =>
            availabilityMap.get(ap.productId),
          ) === true;

        return toVariationResponse(
          variation,
          baseProductsAvailable && addonProductsAvailable && !variation.isDisabled,
        );
      }) ?? [];

  // Menu item is available if not disabled, base products are available,
  // and at least one variation is available (or no variations exist)
  const hasAvailableVariation =
    variationsWithAvailability.length === 0 ||
    variationsWithAvailability.some((v) => v.isAvailable);

  const isAvailable =
    !menuItem.isDisabled && baseProductsAvailable && hasAvailableVariation;

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

export async function getAllMenuItems(
  fastify: FastifyInstance,
  businessId: string,
): Promise<MenuItemResponse[]> {
  const menuItems = await fastify.db.menuItem.findAllByBusinessId(businessId);
  return Promise.all(
    menuItems.map((item) => toMenuItemResponse(fastify, item)),
  );
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

  return toMenuItemResponse(fastify, menuItem);
}

export async function getMenuItemById(
  fastify: FastifyInstance,
  businessId: string,
  menuItemId: string,
): Promise<MenuItemResponse> {
  const menuItem = await fastify.db.menuItem.getById(menuItemId, businessId);
  return toMenuItemResponse(fastify, menuItem);
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

  return toMenuItemResponse(fastify, updated);
}

export async function bulkDeleteMenuItems(
  fastify: FastifyInstance,
  businessId: string,
  ids: string[],
): Promise<void> {
  await fastify.db.menuItem.bulkDelete(ids, businessId);
}
