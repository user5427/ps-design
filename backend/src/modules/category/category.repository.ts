import { In, IsNull, type Repository } from "typeorm";
import { ConflictError, NotFoundError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import type { MenuItem } from "@/modules/menu/menu-item/menu-item.entity";
import type { ServiceDefinition } from "@/modules/appointments/service-definition/service-definition.entity";
import type { Category } from "./category.entity";
import type { ICreateCategory, IUpdateCategory } from "./category.types";

export class CategoryRepository {
  constructor(
    private repository: Repository<Category>,
    private menuItemRepository: Repository<MenuItem>,
    private serviceDefinitionRepository: Repository<ServiceDefinition>,
  ) {}

  async findAllByBusinessId(businessId: string): Promise<Category[]> {
    return this.repository.find({
      where: { businessId, deletedAt: IsNull() },
      order: { name: "ASC" },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findByIdAndBusinessId(
    id: string,
    businessId: string,
  ): Promise<Category | null> {
    return this.repository.findOne({
      where: { id, businessId, deletedAt: IsNull() },
    });
  }

  async getById(id: string, businessId: string): Promise<Category> {
    const category = await this.findByIdAndBusinessId(id, businessId);
    if (!category) {
      throw new NotFoundError("Category not found");
    }
    return category;
  }

  async create(data: ICreateCategory): Promise<Category> {
    try {
      const category = this.repository.create(data);
      return await this.repository.save(category);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("Category with this name already exists");
      }
      throw error;
    }
  }

  async update(
    id: string,
    businessId: string,
    data: IUpdateCategory,
  ): Promise<Category> {
    const category = await this.findByIdAndBusinessId(id, businessId);
    if (!category) {
      throw new NotFoundError("Category not found");
    }

    try {
      await this.repository.update(id, data);
      const updatedCategory = await this.findById(id);
      if (!updatedCategory) {
        throw new NotFoundError("Category not found after update");
      }
      return updatedCategory;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("Category with this name already exists");
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
      throw new NotFoundError(`Categories not found: ${missingIds.join(", ")}`);
    }

    // Check if any category is in use by menu items
    const totalMenuItems = await this.menuItemRepository.count({
      where: { categoryId: In(ids), deletedAt: IsNull() },
    });

    if (totalMenuItems > 0) {
      throw new ConflictError(
        "Cannot delete categories that are in use by menu items",
      );
    }

    // Check if any category is in use by service definitions
    const totalServiceDefinitions =
      await this.serviceDefinitionRepository.count({
        where: { categoryId: In(ids), deletedAt: IsNull() },
      });

    if (totalServiceDefinitions > 0) {
      throw new ConflictError(
        "Cannot delete categories that are in use by services",
      );
    }

    await this.repository.update(ids, { deletedAt: new Date() });
  }
}
