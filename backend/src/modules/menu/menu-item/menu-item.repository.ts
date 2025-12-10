import { IsNull, type Repository, type DataSource, In, type EntityManager } from "typeorm";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import type { Product } from "@/modules/inventory/product/product.entity";
import type { StockLevel } from "@/modules/inventory/stock-level/stock-level.entity";
import type { MenuItemCategory } from "@/modules/menu/menu-item-category/menu-item-category.entity";
import type { MenuItem } from "./menu-item.entity";
import type { MenuItemVariation } from "@/modules/menu/menu-item-variation/menu-item-variation.entity";
import type { MenuItemBaseProduct } from "@/modules/menu/menu-item-base-product/menu-item-base-product.entity";
import type { MenuItemVariationProduct } from "@/modules/menu/menu-item-variation-product/menu-item-variation-product.entity";
import type { ICreateMenuItem, IUpdateMenuItem } from "./menu-item.types";

const MENU_ITEM_RELATIONS = [
  "category",
  "baseProducts",
  "baseProducts.product",
  "baseProducts.product.productUnit",
  "variations",
  "variations.addonProducts",
  "variations.addonProducts.product",
  "variations.addonProducts.product.productUnit",
];

export class MenuItemRepository {
  constructor(
    private dataSource: DataSource,
    private repository: Repository<MenuItem>,
    private categoryRepository: Repository<MenuItemCategory>,
    private variationRepository: Repository<MenuItemVariation>,
    private baseProductRepository: Repository<MenuItemBaseProduct>,
    private variationProductRepository: Repository<MenuItemVariationProduct>,
    private productRepository: Repository<Product>,
    private stockLevelRepository: Repository<StockLevel>,
  ) {}

  async findAllByBusinessId(businessId: string): Promise<MenuItem[]> {
    return this.repository.find({
      where: { businessId, deletedAt: IsNull() },
      relations: MENU_ITEM_RELATIONS,
      order: { baseName: "ASC" },
    });
  }

  async findById(id: string): Promise<MenuItem | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: MENU_ITEM_RELATIONS,
    });
  }

  async findByIdAndBusinessId(
    id: string,
    businessId: string,
  ): Promise<MenuItem | null> {
    return this.repository.findOne({
      where: { id, businessId, deletedAt: IsNull() },
      relations: MENU_ITEM_RELATIONS,
    });
  }

  async getById(id: string, businessId: string): Promise<MenuItem> {
    const menuItem = await this.findByIdAndBusinessId(id, businessId);
    if (!menuItem) {
      throw new NotFoundError("Menu item not found");
    }
    return menuItem;
  }

  private async validateCategoryExists(
    categoryId: string | null | undefined,
    businessId: string,
  ): Promise<void> {
    if (!categoryId) return;

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, businessId, deletedAt: IsNull() },
    });

    if (!category) {
      throw new BadRequestError("Invalid category");
    }
  }

  private async validateProductsExist(
    productIds: string[],
    businessId: string,
  ): Promise<void> {
    if (productIds.length === 0) return;

    const uniqueProductIds = [...new Set(productIds)];

    const products = await this.productRepository.find({
      where: {
        id: In(uniqueProductIds),
        businessId,
        deletedAt: IsNull(),
      },
    });

    if (products.length !== uniqueProductIds.length) {
      throw new BadRequestError("One or more products not found");
    }
  }

  private collectAllProductIds(
    baseProducts: { productId: string }[],
    variations: { addonProducts?: { productId: string }[] }[],
  ): string[] {
    return [
      ...baseProducts.map((bp) => bp.productId),
      ...variations.flatMap((v) => v.addonProducts?.map((ap) => ap.productId) ?? []),
    ];
  }

  private async createBaseProducts(
    manager: EntityManager,
    menuItemId: string,
    baseProducts: { productId: string; quantity: number }[],
  ): Promise<void> {
    if (baseProducts.length === 0) return;

    const entities = baseProducts.map((bp) =>
      manager.create(this.baseProductRepository.target, {
        menuItemId,
        productId: bp.productId,
        quantity: bp.quantity,
      }),
    );
    await manager.save(entities);
  }

  private async createVariationWithAddons(
    manager: EntityManager,
    menuItemId: string,
    variation: {
      name: string;
      type: string;
      priceAdjustment?: number;
      isDisabled?: boolean;
      addonProducts?: { productId: string; quantity: number }[];
    },
  ): Promise<void> {
    const variationEntity = manager.create(this.variationRepository.target, {
      menuItemId,
      name: variation.name,
      type: variation.type,
      priceAdjustment: variation.priceAdjustment ?? 0,
      isDisabled: variation.isDisabled ?? false,
    });
    const savedVariation = await manager.save(variationEntity);

    if (variation.addonProducts && variation.addonProducts.length > 0) {
      const addonEntities = variation.addonProducts.map((ap) =>
        manager.create(this.variationProductRepository.target, {
          variationId: savedVariation.id,
          productId: ap.productId,
          quantity: ap.quantity,
        }),
      );
      await manager.save(addonEntities);
    }
  }

  async create(data: ICreateMenuItem): Promise<MenuItem> {
    const { baseProducts, variations, ...menuItemData } = data;

    // Validate before transaction
    await this.validateCategoryExists(menuItemData.categoryId, data.businessId);
    const allProductIds = this.collectAllProductIds(baseProducts, variations);
    await this.validateProductsExist(allProductIds, data.businessId);

    // Execute transaction
    const menuItemId = await this.dataSource.transaction(async (manager) => {
      try {
        // Create menu item
        const menuItem = manager.create(this.repository.target, menuItemData);
        const savedMenuItem = await manager.save(menuItem);

        // Create base products
        await this.createBaseProducts(manager, savedMenuItem.id, baseProducts);

        // Create variations with addon products
        for (const variation of variations) {
          await this.createVariationWithAddons(manager, savedMenuItem.id, variation);
        }

        return savedMenuItem.id;
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new ConflictError("Menu item with this name already exists");
        }
        throw error;
      }
    });

    // Fetch complete menu item AFTER transaction commits
    const createdMenuItem = await this.findByIdAndBusinessId(menuItemId, data.businessId);
    if (!createdMenuItem) {
      throw new Error("Failed to retrieve created menu item");
    }
    return createdMenuItem;
  }

  async update(
    id: string,
    businessId: string,
    data: IUpdateMenuItem,
  ): Promise<MenuItem> {
    const menuItem = await this.findByIdAndBusinessId(id, businessId);
    if (!menuItem) {
      throw new NotFoundError("Menu item not found");
    }

    const { baseProducts, variations, removeVariationIds, ...updateData } = data;

    // Validate before transaction
    if (updateData.categoryId !== undefined) {
      await this.validateCategoryExists(updateData.categoryId, businessId);
    }
    const allProductIds = this.collectAllProductIds(
      baseProducts ?? [],
      variations ?? [],
    );
    await this.validateProductsExist(allProductIds, businessId);

    // Execute transaction
    await this.dataSource.transaction(async (manager) => {
      try {
        // Update menu item fields
        if (Object.keys(updateData).length > 0) {
          await manager.update(this.repository.target, id, updateData);
        }

        // Replace base products if provided
        if (baseProducts !== undefined) {
          await manager.delete(this.baseProductRepository.target, { menuItemId: id });
          await this.createBaseProducts(manager, id, baseProducts);
        }

        // Soft delete removed variations
        if (removeVariationIds && removeVariationIds.length > 0) {
          await manager.update(
            this.variationRepository.target,
            { id: In(removeVariationIds), menuItemId: id },
            { deletedAt: new Date() },
          );
        }

        // Process variations
        if (variations !== undefined) {
          for (const variation of variations) {
            if (variation.id) {
              // Update existing variation
              await this.updateExistingVariation(manager, id, {
                id: variation.id,
                name: variation.name,
                type: variation.type,
                priceAdjustment: variation.priceAdjustment,
                isDisabled: variation.isDisabled,
                addonProducts: variation.addonProducts,
              });
            } else {
              // Create new variation
              if (!variation.name || !variation.type) {
                throw new BadRequestError("New variations require name and type");
              }
              await this.createVariationWithAddons(manager, id, variation as {
                name: string;
                type: string;
                priceAdjustment?: number;
                isDisabled?: boolean;
                addonProducts?: { productId: string; quantity: number }[];
              });
            }
          }
        }
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new ConflictError("Menu item with this name already exists");
        }
        throw error;
      }
    });

    // Fetch complete menu item AFTER transaction commits
    const updatedMenuItem = await this.findByIdAndBusinessId(id, businessId);
    if (!updatedMenuItem) {
      throw new Error("Failed to retrieve updated menu item");
    }
    return updatedMenuItem;
  }

  private async updateExistingVariation(
    manager: EntityManager,
    menuItemId: string,
    variation: {
      id: string;
      name?: string;
      type?: string;
      priceAdjustment?: number;
      isDisabled?: boolean;
      addonProducts?: { productId: string; quantity: number }[];
    },
  ): Promise<void> {
    const existingVariation = await manager.findOne(this.variationRepository.target, {
      where: { id: variation.id, menuItemId, deletedAt: IsNull() },
    });

    if (!existingVariation) {
      throw new NotFoundError(`Variation ${variation.id} not found`);
    }

    // Build update object
    const updateFields: Partial<MenuItemVariation> = {};
    if (variation.name !== undefined) updateFields.name = variation.name;
    if (variation.type !== undefined) updateFields.type = variation.type;
    if (variation.priceAdjustment !== undefined) updateFields.priceAdjustment = variation.priceAdjustment;
    if (variation.isDisabled !== undefined) updateFields.isDisabled = variation.isDisabled;

    if (Object.keys(updateFields).length > 0) {
      await manager.update(this.variationRepository.target, variation.id, updateFields);
    }

    // Replace addon products if provided
    if (variation.addonProducts !== undefined) {
      await manager.delete(this.variationProductRepository.target, { variationId: variation.id });
      if (variation.addonProducts.length > 0) {
        const addonEntities = variation.addonProducts.map((ap) =>
          manager.create(this.variationProductRepository.target, {
            variationId: variation.id,
            productId: ap.productId,
            quantity: ap.quantity,
          }),
        );
        await manager.save(addonEntities);
      }
    }
  }

  async bulkDelete(ids: string[], businessId: string): Promise<void> {
    for (const id of ids) {
      const menuItem = await this.findByIdAndBusinessId(id, businessId);
      if (!menuItem) {
        throw new NotFoundError(`Menu item ${id} not found`);
      }
    }

    await this.repository.update(ids, { deletedAt: new Date() });
  }

  /**
   * Check if products are available based on stock levels
   * Returns a map of productId -> isAvailable
   */
  async checkProductsAvailability(
    productIds: string[],
    businessId: string,
  ): Promise<Map<string, boolean>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const stockLevels = await this.stockLevelRepository.find({
      where: {
        businessId,
        productId: In(productIds),
      },
    });

    const stockMap = new Map<string, number>();
    for (const level of stockLevels) {
      stockMap.set(level.productId, level.quantity);
    }

    const availabilityMap = new Map<string, boolean>();
    for (const productId of productIds) {
      const quantity = stockMap.get(productId) ?? 0;
      availabilityMap.set(productId, quantity > 0);
    }

    return availabilityMap;
  }
}
