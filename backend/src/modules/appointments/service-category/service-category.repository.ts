import { In, IsNull, type Repository } from "typeorm";
import { ConflictError, NotFoundError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import type { ServiceDefinition } from "@/modules/appointments/service-definition/service-definition.entity";
import type { ServiceCategory } from "./service-category.entity";
import type {
  ICreateServiceCategory,
  IUpdateServiceCategory,
} from "./service-category.types";

export class ServiceCategoryRepository {
  constructor(
    private repository: Repository<ServiceCategory>,
    private serviceDefinitionRepository: Repository<ServiceDefinition>,
  ) {}

  async findAllByBusinessId(businessId: string): Promise<ServiceCategory[]> {
    return this.repository.find({
      where: { businessId, deletedAt: IsNull() },
      order: { name: "ASC" },
    });
  }

  async findById(id: string): Promise<ServiceCategory | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findByIdAndBusinessId(
    id: string,
    businessId: string,
  ): Promise<ServiceCategory | null> {
    return this.repository.findOne({
      where: { id, businessId, deletedAt: IsNull() },
    });
  }

  async getById(id: string, businessId: string): Promise<ServiceCategory> {
    const category = await this.findByIdAndBusinessId(id, businessId);
    if (!category) {
      throw new NotFoundError("Service category not found");
    }
    return category;
  }

  async create(data: ICreateServiceCategory): Promise<void> {
    try {
      const category = this.repository.create(data);
      await this.repository.save(category);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(
          "Service category with this name already exists",
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    businessId: string,
    data: IUpdateServiceCategory,
  ): Promise<void> {
    const category = await this.findByIdAndBusinessId(id, businessId);
    if (!category) {
      throw new NotFoundError("Service category not found");
    }

    try {
      this.repository.update(id, data);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(
          "Service category with this name already exists",
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
        `Service categories not found: ${missingIds.join(", ")}`,
      );
    }

    const totalServiceDefinitions =
      await this.serviceDefinitionRepository.count({
        where: { categoryId: In(ids), deletedAt: IsNull() },
      });

    if (totalServiceDefinitions > 0) {
      throw new ConflictError(
        "Cannot delete categories that are in use by service definitions",
      );
    }

    await this.repository.update(ids, { deletedAt: new Date() });
  }
}
