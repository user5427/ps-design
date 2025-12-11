import { IsNull, type Repository, type DataSource } from "typeorm";
import { BadRequestError, NotFoundError } from "@/shared/errors";
import type { StaffService } from "@/modules/appointments/staff-service/staff-service.entity";
import type { Availability, DayOfWeek } from "./availability.entity";
import type { IBulkSetAvailability } from "./availability.types";

export class AvailabilityRepository {
  constructor(
    private dataSource: DataSource,
    private repository: Repository<Availability>,
    private staffServiceRepository: Repository<StaffService>,
  ) {}

  async findByServiceId(serviceId: string): Promise<Availability[]> {
    return this.repository.find({
      where: { serviceId, deletedAt: IsNull() },
      order: { dayOfWeek: "ASC", startTimeLocal: "ASC" },
    });
  }

  async findById(id: string): Promise<Availability | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async bulkSetForService(
    data: IBulkSetAvailability,
    businessId: string,
  ): Promise<void> {
    // Validate staff service exists and belongs to business
    const staffService = await this.staffServiceRepository.findOne({
      where: { id: data.serviceId, businessId, deletedAt: IsNull() },
      select: ["id"],
    });

    if (!staffService) {
      throw new NotFoundError("Staff service not found");
    }

    // Validate no overlaps within same day
    this.validateNoOverlaps(data.availabilities);

    await this.dataSource.transaction(async (manager) => {
      // Soft delete all existing availabilities for this service
      await manager.update(
        this.repository.target,
        { serviceId: data.serviceId, deletedAt: IsNull() },
        { deletedAt: new Date() },
      );

      // Create new availabilities
      if (data.availabilities.length === 0) {
        return;
      }

      const newAvailabilities = data.availabilities.map((av) =>
        manager.create(this.repository.target, {
          dayOfWeek: av.dayOfWeek as DayOfWeek,
          startTimeLocal: av.startTimeLocal,
          endTimeLocal: av.endTimeLocal,
          serviceId: data.serviceId,
        }),
      );

      await manager.save(newAvailabilities);
    });
  }

  private validateNoOverlaps(
    availabilities: Array<{
      dayOfWeek: string;
      startTimeLocal: string;
      endTimeLocal: string;
    }>,
  ): void {
    const byDay = new Map<string, typeof availabilities>();

    for (const av of availabilities) {
      const existing = byDay.get(av.dayOfWeek) || [];
      existing.push(av);
      byDay.set(av.dayOfWeek, existing);
    }

    for (const [day, slots] of byDay) {
      if (slots.length < 2) continue;

      // Sort by start time
      const sorted = [...slots].sort(
        (a, b) =>
          this.timeToMinutes(a.startTimeLocal) -
          this.timeToMinutes(b.startTimeLocal),
      );

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        if (
          this.timeToMinutes(next.startTimeLocal) <
          this.timeToMinutes(current.endTimeLocal)
        ) {
          throw new BadRequestError(`Overlapping availability slots on ${day}`);
        }
      }
    }
  }

  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }
}
