import {
  IsNull,
  type Repository,
  type DataSource,
  In,
  type EntityManager,
} from "typeorm";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import { executePaginatedQuery } from "@/shared/pagination-utils";
import { MENU_ITEM_MAPPING } from "@ps-design/constants/menu/items";
import type { PaginatedResult } from "@ps-design/schemas/pagination";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";
import type { Product } from "@/modules/inventory/product/product.entity";
import type { StockLevel } from "@/modules/inventory/stock-level/stock-level.entity";
import type { MenuItemCategory } from "@/modules/menu/menu-item-category/menu-item-category.entity";
import type { MenuItem } from "./menu-item.entity";
import type { MenuItemVariation } from "@/modules/menu/menu-item-variation/menu-item-variation.entity";
import type { MenuItemBaseProduct } from "@/modules/menu/menu-item-base-product/menu-item-base-product.entity";
import type { MenuItemVariationProduct } from "@/modules/menu/menu-item-variation-product/menu-item-variation-product.entity";
import type {
  ICreateMenuItem,
  ICreateMenuItemVariation,
  IMenuItemVariationInput,
  IUpdateMenuItem,
} from "./menu-item.types";

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

  async findAllPaginated(
    businessId: string,
    query: UniversalPaginationQuery,
  ): Promise<PaginatedResult<MenuItem>> {
    const qb = this.repository.createQueryBuilder("item");

    qb.leftJoinAndSelect("item.category", "category");
    qb.leftJoinAndSelect("item.baseProducts", "baseProducts");
    qb.leftJoinAndSelect("baseProducts.product", "baseProduct");
    qb.leftJoinAndSelect("baseProduct.productUnit", "baseProductUnit");
    qb.leftJoinAndSelect("item.variations", "variations");
    qb.leftJoinAndSelect("variations.addonProducts", "addonProducts");
    qb.leftJoinAndSelect("addonProducts.product", "addonProduct");
    qb.leftJoinAndSelect("addonProduct.productUnit", "addonProductUnit");

    qb.where("item.businessId = :businessId", { businessId });
    qb.andWhere("item.deletedAt IS NULL");

    // Handle simple search if provided
    if (query.search) {
      qb.andWhere("item.baseName ILIKE :search", {
        search: `%${query.search}%`,
      });
    }

    return executePaginatedQuery(qb, query, MENU_ITEM_MAPPING.fields, "item");
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
    const item = await this.findByIdAndBusinessId(id, businessId);
    if (!item) throw new NotFoundError("Menu item not found");
    return item;
  }

  async create(data: ICreateMenuItem): Promise<MenuItem> {
    const { baseProducts, variations, ...menuItemData } = data;

    const allProductIds = this.collectAllProductIds(baseProducts, variations);
    await this.validateRelations(
      data.businessId,
      menuItemData.categoryId,
      allProductIds,
    );

    const savedId = await this.dataSource.transaction(async (manager) => {
      try {
        const menuItem = manager.create(this.repository.target, menuItemData);
        const saved = await manager.save(menuItem);

        await this.createBaseProducts(manager, saved.id, baseProducts);

        for (const variation of variations) {
          await this.createVariationWithAddons(manager, saved.id, variation);
        }

        return saved.id;
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new ConflictError("Menu item with this name already exists");
        }
        throw error;
      }
    });

    const createdMenuItem = await this.findByIdAndBusinessId(
      savedId,
      data.businessId,
    );
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
    const _menuItem = await this.getById(id, businessId);
    const { baseProducts, variations, removeVariationIds, ...updateData } =
      data;

    const allProductIds = this.collectAllProductIds(
      baseProducts ?? [],
      variations ?? [],
    );
    await this.validateRelations(
      businessId,
      updateData.categoryId,
      allProductIds,
    );

    await this.dataSource.transaction(async (manager) => {
      try {
        if (Object.keys(updateData).length > 0) {
          await manager.update(this.repository.target, { id }, updateData);
        }

        if (baseProducts !== undefined) {
          await manager.delete(this.baseProductRepository.target, {
            menuItemId: id,
          });
          await this.createBaseProducts(manager, id, baseProducts);
        }

        // Sync Variations (Soft-delete removed variations)
        if (removeVariationIds?.length) {
          await manager.update(
            this.variationRepository.target,
            { id: In(removeVariationIds), menuItemId: id },
            { deletedAt: new Date() },
          );
        }

        if (variations?.length) {
          for (const v of variations) {
            v.id
              ? await this.updateExistingVariation(manager, id, v as any)
              : await this.createVariationWithAddons(manager, id, v as any);
          }
        }
      } catch (error) {
        if (isUniqueConstraintError(error))
          throw new ConflictError("Duplicate name exists");
        throw error;
      }
    });

    const updatedMenuItem = await this.findByIdAndBusinessId(id, businessId);
    if (!updatedMenuItem) {
      throw new Error("Failed to retrieve updated menu item");
    }
    return updatedMenuItem;
  }

  private async validateRelations(
    businessId: string,
    categoryId?: string | null,
    productIds: string[] = [],
  ): Promise<void> {
    const tasks: Promise<void>[] = [];

    if (categoryId) {
      tasks.push(this.validateCategoryExists(categoryId, businessId));
    }
    if (productIds.length > 0) {
      tasks.push(this.validateProductsExist(productIds, businessId));
    }

    await Promise.all(tasks);
  }

  private async validateCategoryExists(
    categoryId: string,
    businessId: string,
  ): Promise<void> {
    const exists = await this.categoryRepository.findOne({
      where: { id: categoryId, businessId, deletedAt: IsNull() },
      select: ["id"],
    });
    if (!exists) throw new BadRequestError("Invalid category");
  }

  private async validateProductsExist(
    productIds: string[],
    businessId: string,
  ): Promise<void> {
    const uniqueIds = [...new Set(productIds)];
    const count = await this.productRepository.count({
      where: { id: In(uniqueIds), businessId, deletedAt: IsNull() },
    });
    if (count !== uniqueIds.length)
      throw new BadRequestError("One or more products not found");
  }

  private async createBaseProducts(
    manager: EntityManager,
    menuItemId: string,
    baseProducts: { productId: string; quantity: number }[],
  ): Promise<void> {
    if (!baseProducts.length) return;
    await manager.insert(
      this.baseProductRepository.target,
      baseProducts.map((bp) => ({ ...bp, menuItemId })),
    );
  }

  private async createVariationWithAddons(
    manager: EntityManager,
    menuItemId: string,
    variation: ICreateMenuItemVariation,
  ): Promise<void> {
    const variationEntity = manager.create(this.variationRepository.target, {
      ...variation,
      menuItemId,
      priceAdjustment: variation.priceAdjustment ?? 0,
      isDisabled: variation.isDisabled ?? false,
    });
    const saved = await manager.save(variationEntity);

    if (variation.addonProducts?.length) {
      await manager.insert(
        this.variationProductRepository.target,
        variation.addonProducts.map((ap: any) => ({
          ...ap,
          variationId: saved.id,
        })),
      );
    }
  }

  private async updateExistingVariation(
    manager: EntityManager,
    menuItemId: string,
    variation: IMenuItemVariationInput,
  ): Promise<void> {
    const existing = await manager.findOne(this.variationRepository.target, {
      where: { id: variation.id, menuItemId, deletedAt: IsNull() },
    });
    if (!existing)
      throw new NotFoundError(`Variation ${variation.id} not found`);

    const { id, addonProducts, ...updateFields } = variation;

    if (Object.keys(updateFields).length > 0) {
      await manager.update(this.variationRepository.target, id, updateFields);
    }

    if (addonProducts !== undefined) {
      await manager.delete(this.variationProductRepository.target, {
        variationId: id,
      });
      if (addonProducts.length > 0) {
        await manager.insert(
          this.variationProductRepository.target,
          addonProducts.map((ap: any) => ({ ...ap, variationId: id })),
        );
      }
    }
  }

  private collectAllProductIds(
    base: { productId: string }[],
    vars: { addonProducts?: { productId: string }[] }[],
  ): string[] {
    const baseIds = base.map((p) => p.productId);
    const addonIds = vars.flatMap(
      (v) => v.addonProducts?.map((p) => p.productId) ?? [],
    );
    return [...baseIds, ...addonIds];
  }

  async bulkDelete(ids: string[], businessId: string): Promise<void> {
    const count = await this.repository.count({
      where: { id: In(ids), businessId, deletedAt: IsNull() },
    });
    if (count !== ids.length)
      throw new NotFoundError("One or more items not found");
    await this.repository.update(ids, { deletedAt: new Date() });
  }

  async getProductStockLevels(
    productIds: string[],
    businessId: string,
  ): Promise<Map<string, number>> {
    if (!productIds.length) return new Map();

    const results = await this.stockLevelRepository.find({
      where: { businessId, productId: In(productIds) },
      select: ["productId", "quantity"],
    });

    const stockMap = new Map<string, number>(productIds.map((id) => [id, 0]));
    for (const r of results) {
      stockMap.set(r.productId, Number(r.quantity));
    }
    return stockMap;
  }
}
