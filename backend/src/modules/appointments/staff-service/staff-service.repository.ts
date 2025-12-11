import { In, IsNull, type Repository } from "typeorm";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared/errors";
import { isUniqueConstraintError } from "@/shared/typeorm-error-utils";
import type { User } from "@/modules/user/user.entity";
import type { ServiceDefinition } from "@/modules/appointments/service-definition/service-definition.entity";
import type { StaffService } from "./staff-service.entity";
import type {
  ICreateStaffService,
  IUpdateStaffService,
} from "./staff-service.types";

const STAFF_SERVICE_RELATIONS = [
  "employee",
  "serviceDefinition",
  "serviceDefinition.category",
];

export class StaffServiceRepository {
  constructor(
    private repository: Repository<StaffService>,
    private userRepository: Repository<User>,
    private serviceDefinitionRepository: Repository<ServiceDefinition>,
  ) {}

  async findAllByBusinessId(businessId: string): Promise<StaffService[]> {
    return this.repository.find({
      where: { businessId, deletedAt: IsNull() },
      relations: STAFF_SERVICE_RELATIONS,
      order: { createdAt: "DESC" },
    });
  }

  async findById(id: string): Promise<StaffService | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: STAFF_SERVICE_RELATIONS,
    });
  }

  async findByIdAndBusinessId(
    id: string,
    businessId: string,
  ): Promise<StaffService | null> {
    return this.repository.findOne({
      where: { id, businessId, deletedAt: IsNull() },
      relations: STAFF_SERVICE_RELATIONS,
    });
  }

  async getById(id: string, businessId: string): Promise<StaffService> {
    const staffService = await this.findByIdAndBusinessId(id, businessId);
    if (!staffService) {
      throw new NotFoundError("Staff service not found");
    }
    return staffService;
  }

  async findByEmployeeId(
    employeeId: string,
    businessId: string,
  ): Promise<StaffService[]> {
    return this.repository.find({
      where: { employeeId, businessId, deletedAt: IsNull() },
      relations: STAFF_SERVICE_RELATIONS,
    });
  }

  async findByServiceDefinitionId(
    serviceDefinitionId: string,
    businessId: string,
  ): Promise<StaffService[]> {
    return this.repository.find({
      where: { serviceDefinitionId, businessId, deletedAt: IsNull() },
      relations: STAFF_SERVICE_RELATIONS,
    });
  }

  async create(data: ICreateStaffService): Promise<void> {
    await this.validateRelations(
      data.businessId,
      data.employeeId,
      data.serviceDefinitionId,
    );

    try {
      const staffService = this.repository.create({
        price: data.price,
        baseDuration: data.baseDuration,
        isDisabled: data.isDisabled ?? false,
        businessId: data.businessId,
        employeeId: data.employeeId,
        serviceDefinitionId: data.serviceDefinitionId,
      });
      await this.repository.save(staffService);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError("This employee already offers this service");
      }
      throw error;
    }
  }

  async update(
    id: string,
    businessId: string,
    data: IUpdateStaffService,
  ): Promise<void> {
    const staffService = await this.findByIdAndBusinessId(id, businessId);
    if (!staffService) {
      throw new NotFoundError("Staff service not found");
    }

    await this.repository.update(id, data);
    await this.findById(id);
  }

  async bulkDelete(ids: string[], businessId: string): Promise<void> {
    const staffServices = await this.repository.find({
      where: { id: In(ids), businessId, deletedAt: IsNull() },
    });

    if (staffServices.length !== ids.length) {
      const foundIds = new Set(staffServices.map((s) => s.id));
      const missingIds = ids.filter((id) => !foundIds.has(id));
      throw new NotFoundError(
        `Staff services not found: ${missingIds.join(", ")}`,
      );
    }

    await this.repository.update(ids, { deletedAt: new Date() });
  }

  private async validateRelations(
    businessId: string,
    employeeId: string,
    serviceDefinitionId: string,
  ): Promise<void> {
    const [employee, serviceDefinition] = await Promise.all([
      this.userRepository.findOne({
        where: { id: employeeId, businessId, deletedAt: IsNull() },
        select: ["id"],
      }),
      this.serviceDefinitionRepository.findOne({
        where: { id: serviceDefinitionId, businessId, deletedAt: IsNull() },
        select: ["id"],
      }),
    ]);

    if (!employee) {
      throw new BadRequestError("Invalid employee");
    }
    if (!serviceDefinition) {
      throw new BadRequestError("Invalid service definition");
    }
  }
}
