import { In, IsNull, type Repository } from "typeorm";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import type { ServiceCategory } from "@/modules/appointments/service-category/service-category.entity";
import type { StaffService } from "@/modules/appointments/staff-service/staff-service.entity";
import type { ServiceDefinition } from "./service-definition.entity";
import type {
  ICreateServiceDefinition,
  IUpdateServiceDefinition,
} from "./service-definition.types";

const SERVICE_DEFINITION_RELATIONS = ["category"];

export class ServiceDefinitionRepository {
  constructor(
    private repository: Repository<ServiceDefinition>,
    private categoryRepository: Repository<ServiceCategory>,
    private staffServiceRepository: Repository<StaffService>,
  ) {}

  async findAllByBusinessId(
    businessId: string,
    options?: { activeOnly?: boolean },
  ): Promise<ServiceDefinition[]> {
    const where: Record<string, unknown> = { businessId, deletedAt: IsNull() };
    if (options?.activeOnly) {
      where.isDisabled = false;
    }
    return this.repository.find({
      where,
      relations: SERVICE_DEFINITION_RELATIONS,
      order: { name: "ASC" },
    });
  }

  async findById(id: string): Promise<ServiceDefinition | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: SERVICE_DEFINITION_RELATIONS,
    });
  }

  async findByIdAndBusinessId(
    id: string,
    businessId: string,
  ): Promise<ServiceDefinition | null> {
    return this.repository.findOne({
      where: { id, businessId, deletedAt: IsNull() },
      relations: SERVICE_DEFINITION_RELATIONS,
    });
  }

  async getById(id: string, businessId: string): Promise<ServiceDefinition> {
    const definition = await this.findByIdAndBusinessId(id, businessId);
    if (!definition) {
      throw new NotFoundError("Service definition not found");
    }
    return definition;
  }

  async create(data: ICreateServiceDefinition): Promise<void> {
    if (data.categoryId) {
      await this.validateCategoryExists(data.categoryId, data.businessId);
    }

    try {
      const definition = this.repository.create({
        name: data.name,
        description: data.description ?? null,
        isDisabled: data.isDisabled ?? false,
        businessId: data.businessId,
        categoryId: data.categoryId ?? null,
      });
      await this.repository.save(definition);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(
          "Service definition with this name already exists",
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    businessId: string,
    data: IUpdateServiceDefinition,
  ): Promise<void> {
    const definition = await this.findByIdAndBusinessId(id, businessId);
    if (!definition) {
      throw new NotFoundError("Service definition not found");
    }

    if (data.categoryId !== undefined && data.categoryId !== null) {
      await this.validateCategoryExists(data.categoryId, businessId);
    }

    try {
      await this.repository.update(id, data);
      await this.findById(id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(
          "Service definition with this name already exists",
        );
      }
      throw error;
    }
  }

  async bulkDelete(ids: string[], businessId: string): Promise<void> {
    const definitions = await this.repository.find({
      where: { id: In(ids), businessId, deletedAt: IsNull() },
    });

    if (definitions.length !== ids.length) {
      const foundIds = new Set(definitions.map((d) => d.id));
      const missingIds = ids.filter((id) => !foundIds.has(id));
      throw new NotFoundError(
        `Service definitions not found: ${missingIds.join(", ")}`,
      );
    }

    const totalStaffServices = await this.staffServiceRepository.count({
      where: { serviceDefinitionId: In(ids), deletedAt: IsNull() },
    });

    if (totalStaffServices > 0) {
      throw new ConflictError(
        "Cannot delete service definitions that are in use by staff services",
      );
    }

    await this.repository.update(ids, { deletedAt: new Date() });
  }

  private async validateCategoryExists(
    categoryId: string,
    businessId: string,
  ): Promise<void> {
    const exists = await this.categoryRepository.findOne({
      where: { id: categoryId, businessId, deletedAt: IsNull() },
      select: ["id"],
    });
    if (!exists) {
      throw new BadRequestError("Invalid category");
    }
  }
}
