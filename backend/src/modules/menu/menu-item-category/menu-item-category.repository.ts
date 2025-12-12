import { In, IsNull, type Repository } from "typeorm";
import { ConflictError, NotFoundError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import { executePaginatedQuery } from "@/shared/pagination-utils";
import { MENU_ITEM_CATEGORY_MAPPING } from "@ps-design/constants/menu/category";
import type { MenuItem } from "@/modules/menu/menu-item/menu-item.entity";
import type { MenuItemCategory } from "./menu-item-category.entity";
import type {
  ICreateMenuItemCategory,
  IUpdateMenuItemCategory,
} from "./menu-item-category.types";
import type { PaginatedResult } from "@ps-design/schemas/pagination";
import type { UniversalPaginationQuery } from "@ps-design/schemas/pagination";

export class MenuItemCategoryRepository {
  constructor(
    private repository: Repository<MenuItemCategory>,
    private menuItemRepository: Repository<MenuItem>,
  ) {}

  async findAllPaginated(
    businessId: string,
    query: UniversalPaginationQuery,
  ): Promise<PaginatedResult<MenuItemCategory>> {
    const qb = this.repository.createQueryBuilder("category");

    qb.where("category.businessId = :businessId", { businessId });
    qb.andWhere("category.deletedAt IS NULL");

    // Handle simple search if provided
    if (query.search) {
      qb.andWhere("category.name ILIKE :search", {
        search: `%${query.search}%`,
      });
    }

    return executePaginatedQuery(
      qb,
      query,
      MENU_ITEM_CATEGORY_MAPPING.fields,
      "category",
    );
  }

  async findById(id: string): Promise<MenuItemCategory | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findByIdAndBusinessId(
    id: string,
    businessId: string,
  ): Promise<MenuItemCategory | null> {
    return this.repository.findOne({
      where: { id, businessId, deletedAt: IsNull() },
    });
  }

  async getById(id: string, businessId: string): Promise<MenuItemCategory> {
    const category = await this.findByIdAndBusinessId(id, businessId);
    if (!category) {
      throw new NotFoundError("Menu item category not found");
    }
    return category;
  }

  async create(data: ICreateMenuItemCategory): Promise<MenuItemCategory> {
    try {
      const category = this.repository.create(data);
      return await this.repository.save(category);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(
          "Menu item category with this name already exists",
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    businessId: string,
    data: IUpdateMenuItemCategory,
  ): Promise<MenuItemCategory> {
    const category = await this.findByIdAndBusinessId(id, businessId);
    if (!category) {
      throw new NotFoundError("Menu item category not found");
    }

    try {
      await this.repository.update(id, data);
      const updatedCategory = await this.findById(id);
      if (!updatedCategory) {
        throw new NotFoundError("Menu item category not found after update");
      }
      return updatedCategory;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(
          "Menu item category with this name already exists",
        );
      }
      throw error;
    }
  }

  async bulkDelete(ids: string[], businessId: string): Promise<void> {
    const categories = await this.repository.find({
      where: { id: In(ids), businessId, deletedAt: IsNull() },
    });

    if (categories.length !== ids.length) {
      const foundIds = new Set(categories.map((c) => c.id));
      const missingIds = ids.filter((id) => !foundIds.has(id));
      throw new NotFoundError(
        `Menu item categories not found: ${missingIds.join(", ")}`,
      );
    }

    const totalMenuItems = await this.menuItemRepository.count({
      where: { categoryId: In(ids), deletedAt: IsNull() },
    });

    if (totalMenuItems > 0) {
      throw new ConflictError(
        "Cannot delete categories that are in use by menu items",
      );
    }

    await this.repository.update(ids, { deletedAt: new Date() });
  }
}
