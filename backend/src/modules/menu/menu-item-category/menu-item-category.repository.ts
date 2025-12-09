import { IsNull, type Repository } from "typeorm";
import { ConflictError, NotFoundError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import type { MenuItem } from "@/modules/menu/menu-item/menu-item.entity";
import type { MenuItemCategory } from "./menu-item-category.entity";
import type {
  ICreateMenuItemCategory,
  IUpdateMenuItemCategory,
} from "./menu-item-category.types";

export class MenuItemCategoryRepository {
  constructor(
    private repository: Repository<MenuItemCategory>,
    private menuItemRepository: Repository<MenuItem>,
  ) {}

  async findAllByBusinessId(businessId: string): Promise<MenuItemCategory[]> {
    return this.repository.find({
      where: { businessId, deletedAt: IsNull() },
      order: { name: "ASC" },
    });
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
    for (const id of ids) {
      const category = await this.findByIdAndBusinessId(id, businessId);
      if (!category) {
        throw new NotFoundError(`Menu item category ${id} not found`);
      }

      const menuItemsCount = await this.menuItemRepository.count({
        where: { categoryId: id, deletedAt: IsNull() },
      });

      if (menuItemsCount > 0) {
        throw new ConflictError(
          `Cannot delete category "${category.name}" that is in use by menu items`,
        );
      }
    }

    await this.repository.update(ids, { deletedAt: new Date() });
  }
}
