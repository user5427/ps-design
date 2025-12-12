import { IsNull, type Repository, type DataSource } from "typeorm";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared/errors";
import type { StaffService } from "@/modules/appointments/staff-service/staff-service.entity";
import type { AvailabilityRepository } from "@/modules/appointments/availability/availability.repository";
import type { Appointment, AppointmentStatus } from "./appointment.entity";
import type {
  ICreateAppointment,
  IUpdateAppointment,
} from "./appointment.types";

const APPOINTMENT_RELATIONS = [
  "service",
  "service.employee",
  "service.serviceDefinition",
  "service.serviceDefinition.category",
];

export class AppointmentRepository {
  constructor(
    private dataSource: DataSource,
    private repository: Repository<Appointment>,
    private staffServiceRepository: Repository<StaffService>,
    private availabilityRepository: AvailabilityRepository,
  ) {}

  async findAllByBusinessId(businessId: string): Promise<Appointment[]> {
    const queryBuilder = this.repository
      .createQueryBuilder("appointment")
      .leftJoinAndSelect("appointment.service", "service")
      .leftJoinAndSelect("service.employee", "employee")
      .leftJoinAndSelect("service.serviceDefinition", "serviceDefinition")
      .leftJoinAndSelect("serviceDefinition.category", "category")
      .where("appointment.businessId = :businessId", { businessId })
      .orderBy("appointment.startTime", "DESC");

    return queryBuilder.getMany();
  }

  async findById(id: string): Promise<Appointment | null> {
    return this.repository.findOne({
      where: { id },
      relations: APPOINTMENT_RELATIONS,
    });
  }

  async findByIdAndBusinessId(
    id: string,
    businessId: string,
  ): Promise<Appointment | null> {
    return this.repository.findOne({
      where: { id, businessId },
      relations: APPOINTMENT_RELATIONS,
    });
  }

  async getById(id: string, businessId: string): Promise<Appointment> {
    const appointment = await this.findByIdAndBusinessId(id, businessId);
    if (!appointment) {
      throw new NotFoundError("Appointment not found");
    }
    return appointment;
  }

  async create(data: ICreateAppointment): Promise<void> {
    const staffService = await this.staffServiceRepository.findOne({
      where: {
        id: data.serviceId,
        businessId: data.businessId,
        deletedAt: IsNull(),
      },
      relations: ["serviceDefinition"],
    });

    if (!staffService) {
      throw new BadRequestError("Invalid service");
    }

    const duration = staffService.serviceDefinition.baseDuration;

    // Check employee availability
    const isAvailable = await this.availabilityRepository.isEmployeeAvailable(
      staffService.employeeId,
      data.businessId,
      data.startTime,
      duration,
    );

    if (!isAvailable) {
      throw new BadRequestError("Employee is not available at this time");
    }

    await this.checkForOverlap(data.serviceId, data.startTime, duration);

    return await this.dataSource.transaction(async (manager) => {
      const appointment = manager.create(this.repository.target, {
        customerName: data.customerName,
        customerPhone: data.customerPhone ?? null,
        customerEmail: data.customerEmail ?? null,
        startTime: data.startTime,
        notes: data.notes ?? null,
        status: "RESERVED" as AppointmentStatus,
        businessId: data.businessId,
        serviceId: data.serviceId,
        createdById: data.createdById,
      });

      await manager.save(appointment);
    });
  }

  async update(
    id: string,
    businessId: string,
    data: IUpdateAppointment,
  ): Promise<void> {
    const appointment = await this.findByIdAndBusinessId(id, businessId);
    if (!appointment) {
      throw new NotFoundError("Appointment not found");
    }

    if (appointment.status !== "RESERVED") {
      throw new BadRequestError("Cannot update closed appointment");
    }

    this.repository.update(id, data);
  }

  async updateStatus(
    id: string,
    businessId: string,
    status: AppointmentStatus,
  ): Promise<Appointment> {
    const appointment = await this.findByIdAndBusinessId(id, businessId);
    if (!appointment) {
      throw new NotFoundError("Appointment not found");
    }

    // Validate status transitions
    this.validateStatusTransition(appointment.status, status);

    await this.repository.update(id, { status });

    return this.getById(id, businessId);
  }

  private async checkForOverlap(
    serviceId: string,
    startTime: Date,
    blockDuration: number,
    excludeAppointmentId?: string,
  ): Promise<void> {
    const endTime = new Date(startTime.getTime() + blockDuration * 60 * 1000);

    const queryBuilder = this.repository
      .createQueryBuilder("appointment")
      .leftJoinAndSelect("appointment.service", "service")
      .leftJoinAndSelect("service.serviceDefinition", "serviceDefinition")
      .where("appointment.serviceId = :serviceId", { serviceId })
      .andWhere("appointment.status != :cancelledStatus", {
        cancelledStatus: "CANCELLED",
      })
      .andWhere(
        `(
          (appointment.startTime < :endTime AND 
           appointment.startTime + (serviceDefinition.baseDuration * interval '1 minute') > :startTime)
        )`,
        { startTime, endTime },
      );

    if (excludeAppointmentId) {
      queryBuilder.andWhere("appointment.id != :excludeId", {
        excludeId: excludeAppointmentId,
      });
    }

    const overlapping = await queryBuilder.getCount();

    if (overlapping > 0) {
      throw new ConflictError(
        "This time slot overlaps with an existing appointment",
      );
    }
  }

  private validateStatusTransition(
    currentStatus: AppointmentStatus,
    newStatus: AppointmentStatus,
  ): void {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      RESERVED: ["CANCELLED", "PAID"],
      CANCELLED: [],
      PAID: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestError(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
