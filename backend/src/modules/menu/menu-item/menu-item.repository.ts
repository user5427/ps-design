import { IsNull, type Repository, type DataSource, In } from "typeorm";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import type { Product } from "@/modules/inventory/product/product.entity";
import type { StockLevel } from "@/modules/inventory/stock-level/stock-level.entity";
import type { MenuItemCategory } from "@/modules/menu/menu-item-category/menu-item-category.entity";
import type { MenuItem } from "./menu-item.entity";
import type { MenuItemVariation } from "@/modules/menu/menu-item-variation/menu-item-variation.entity";
import { MenuItemVariationType } from "@/modules/menu/menu-item-variation/menu-item-variation.types";
import type { MenuItemBaseProduct } from "@/modules/menu/menu-item-base-product/menu-item-base-product.entity";
import type { MenuItemVariationProduct } from "@/modules/menu/menu-item-variation-product/menu-item-variation-product.entity";
import type { ICreateMenuItem, IUpdateMenuItem } from "./menu-item.types";

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
      relations: [
        "category",
        "baseProducts",
        "baseProducts.product",
        "baseProducts.product.productUnit",
        "variations",
        "variations.addonProducts",
        "variations.addonProducts.product",
        "variations.addonProducts.product.productUnit",
      ],
      order: { baseName: "ASC" },
    });
  }

  async findById(id: string): Promise<MenuItem | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: [
        "category",
        "baseProducts",
        "baseProducts.product",
        "baseProducts.product.productUnit",
        "variations",
        "variations.addonProducts",
        "variations.addonProducts.product",
        "variations.addonProducts.product.productUnit",
      ],
    });
  }

  async findByIdAndBusinessId(
    id: string,
    businessId: string,
  ): Promise<MenuItem | null> {
    return this.repository.findOne({
      where: { id, businessId, deletedAt: IsNull() },
      relations: [
        "category",
        "baseProducts",
        "baseProducts.product",
        "baseProducts.product.productUnit",
        "variations",
        "variations.addonProducts",
        "variations.addonProducts.product",
        "variations.addonProducts.product.productUnit",
      ],
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

  async create(data: ICreateMenuItem): Promise<MenuItem> {
    const { baseProducts, variations, ...menuItemData } = data;

    await this.validateCategoryExists(menuItemData.categoryId, data.businessId);

    const allProductIds = [
      ...baseProducts.map((bp) => bp.productId),
      ...variations.flatMap((v) => v.addonProducts.map((ap) => ap.productId)),
    ];
    await this.validateProductsExist(allProductIds, data.businessId);

    return await this.dataSource.transaction(async (manager) => {
      try {
        const menuItem = manager.create(this.repository.target, menuItemData);
        const savedMenuItem = await manager.save(menuItem);

        if (baseProducts.length > 0) {
          const baseProductEntities = baseProducts.map((bp) =>
            manager.create(this.baseProductRepository.target, {
              menuItemId: savedMenuItem.id,
              productId: bp.productId,
              quantity: bp.quantity,
            }),
          );
          await manager.save(baseProductEntities);
        }

        for (const variation of variations) {
          const { addonProducts, ...variationData } = variation;
          const variationEntity = manager.create(
            this.variationRepository.target,
            {
              ...variationData,
              type: variationData.type as MenuItemVariationType,
              menuItemId: savedMenuItem.id,
            },
          );
          const savedVariation = await manager.save(variationEntity);

          if (addonProducts.length > 0) {
            const addonProductEntities = addonProducts.map((ap) =>
              manager.create(this.variationProductRepository.target, {
                variationId: savedVariation.id,
                productId: ap.productId,
                quantity: ap.quantity,
              }),
            );
            await manager.save(addonProductEntities);
          }
        }

        const createdMenuItem = await this.findByIdAndBusinessId(
          savedMenuItem.id,
          data.businessId,
        );
        if (!createdMenuItem) {
          throw new Error("Failed to retrieve created menu item");
        }
        return createdMenuItem;
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new ConflictError("Menu item with this name already exists");
        }
        throw error;
      }
    });
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

    const { baseProducts, variations, removeVariationIds, ...updateData } =
      data;

    if (updateData.categoryId !== undefined) {
      await this.validateCategoryExists(updateData.categoryId, businessId);
    }

    const allProductIds = [
      ...(baseProducts?.map((bp) => bp.productId) ?? []),
      ...(variations?.flatMap((v) => v.addonProducts?.map((ap) => ap.productId) ?? []) ?? []),
    ];
    await this.validateProductsExist(allProductIds, businessId);

    return await this.dataSource.transaction(async (manager) => {
      try {
        if (Object.keys(updateData).length > 0) {
          await manager.update(this.repository.target, id, updateData);
        }

        if (baseProducts !== undefined) {
          await manager.delete(this.baseProductRepository.target, {
            menuItemId: id,
          });
          if (baseProducts.length > 0) {
            const baseProductEntities = baseProducts.map((bp) =>
              manager.create(this.baseProductRepository.target, {
                menuItemId: id,
                productId: bp.productId,
                quantity: bp.quantity,
              }),
            );
            await manager.save(baseProductEntities);
          }
        }

        if (removeVariationIds && removeVariationIds.length > 0) {
          await manager.update(
            this.variationRepository.target,
            { id: In(removeVariationIds), menuItemId: id },
            { deletedAt: new Date() },
          );
        }

        if (variations !== undefined) {
          for (const variation of variations) {
            const { addonProducts, id: variationId, ...variationData } = variation;

            if (variationId) {
              const existingVariation = await manager.findOne(
                this.variationRepository.target,
                {
                  where: {
                    id: variationId,
                    menuItemId: id,
                    deletedAt: IsNull(),
                  },
                },
              );

              if (!existingVariation) {
                throw new NotFoundError(`Variation ${variationId} not found`);
              }

              if (Object.keys(variationData).length > 0) {
                const updateData: Partial<MenuItemVariation> = {};
                if (variationData.name !== undefined)
                  updateData.name = variationData.name;
                if (variationData.type !== undefined)
                  updateData.type = variationData.type as MenuItemVariationType;
                if (variationData.priceAdjustment !== undefined)
                  updateData.priceAdjustment = variationData.priceAdjustment;
                if (variationData.isDisabled !== undefined)
                  updateData.isDisabled = variationData.isDisabled;

                if (Object.keys(updateData).length > 0) {
                  await manager.update(
                    this.variationRepository.target,
                    variationId,
                    updateData,
                  );
                }
              }

              if (addonProducts !== undefined) {
                await manager.delete(this.variationProductRepository.target, {
                  variationId,
                });
                if (addonProducts.length > 0) {
                  const addonProductEntities = addonProducts.map((ap) =>
                    manager.create(this.variationProductRepository.target, {
                      variationId,
                      productId: ap.productId,
                      quantity: ap.quantity,
                    }),
                  );
                  await manager.save(addonProductEntities);
                }
              }
            } else {
              if (!variation.name || !variation.type) {
                throw new BadRequestError(
                  "New variations require name and type",
                );
              }

              const variationEntity = manager.create(
                this.variationRepository.target,
                {
                  name: variation.name,
                  type: variation.type as MenuItemVariationType,
                  priceAdjustment: variation.priceAdjustment ?? 0,
                  isDisabled: variation.isDisabled ?? false,
                  menuItemId: id,
                },
              );
              const savedVariation = await manager.save(variationEntity);

              if (addonProducts && addonProducts.length > 0) {
                const addonProductEntities = addonProducts.map((ap) =>
                  manager.create(this.variationProductRepository.target, {
                    variationId: savedVariation.id,
                    productId: ap.productId,
                    quantity: ap.quantity,
                  }),
                );
                await manager.save(addonProductEntities);
              }
            }
          }
        }

        const updatedMenuItem = await this.findByIdAndBusinessId(
          id,
          businessId,
        );
        if (!updatedMenuItem) {
          throw new Error("Failed to retrieve updated menu item");
        }
        return updatedMenuItem;
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new ConflictError("Menu item with this name already exists");
        }
        throw error;
      }
    });
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

    const availabilityMap = new Map<string, boolean>();
    const stockMap = new Map<string, number>();

    for (const level of stockLevels) {
      stockMap.set(level.productId, level.quantity);
    }

    for (const productId of productIds) {
      const quantity = stockMap.get(productId) ?? 0;
      availabilityMap.set(productId, quantity > 0);
    }

    return availabilityMap;
  }
}
