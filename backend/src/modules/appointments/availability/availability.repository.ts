import { IsNull, type Repository, type DataSource } from "typeorm";
import { BadRequestError, NotFoundError } from "@/shared/errors";
import type { User } from "@/modules/user/user.entity";
import type { Availability, DayOfWeek } from "./availability.entity";
import type {
  IBulkSetAvailability,
  ICreateAvailability,
} from "./availability.types";

const NEXT_DAY: Record<DayOfWeek, DayOfWeek> = {
  MON: "TUE",
  TUE: "WED",
  WED: "THU",
  THU: "FRI",
  FRI: "SAT",
  SAT: "SUN",
  SUN: "MON",
};

const PREVIOUS_DAY: Record<DayOfWeek, DayOfWeek> = {
  MON: "SUN",
  TUE: "MON",
  WED: "TUE",
  THU: "WED",
  FRI: "THU",
  SAT: "FRI",
  SUN: "SAT",
};

export class AvailabilityRepository {
  constructor(
    private dataSource: DataSource,
    private repository: Repository<Availability>,
    private userRepository: Repository<User>,
  ) {}

  async findByUserId(
    userId: string,
    businessId: string,
  ): Promise<Availability[]> {
    return this.repository.find({
      where: { userId, businessId, deletedAt: IsNull() },
      order: { dayOfWeek: "ASC", startTime: "ASC" },
    });
  }

  async findById(id: string): Promise<Availability | null> {
    return this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async bulkSetForUser(data: IBulkSetAvailability): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        id: data.userId,
        businessId: data.businessId,
        deletedAt: IsNull(),
      },
      select: ["id"],
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    this.validateNoOverlaps(data.availabilities);

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        this.repository.target,
        {
          userId: data.userId,
          businessId: data.businessId,
          deletedAt: IsNull(),
        },
        { deletedAt: new Date() },
      );

      if (data.availabilities.length === 0) {
        return;
      }

      const newAvailabilities = data.availabilities.map((av) =>
        manager.create(this.repository.target, {
          dayOfWeek: av.dayOfWeek,
          startTime: av.startTime,
          endTime: av.endTime,
          isOvernight: av.isOvernight,
          userId: data.userId,
          businessId: data.businessId,
        }),
      );

      await manager.save(newAvailabilities);
    });
  }

  /**
   * Check if an employee is available at a specific datetime for a given duration
   */
  async isEmployeeAvailable(
    userId: string,
    businessId: string,
    startTime: Date,
    durationMinutes: number,
  ): Promise<boolean> {
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const startDayOfWeek = this.dateToDayOfWeek(startTime);
    const endDayOfWeek = this.dateToDayOfWeek(endTime);

    const availabilities = await this.findByUserId(userId, businessId);

    if (availabilities.length === 0) {
      return false;
    }

    return this.isTimeRangeWithinAvailability(
      startTime,
      endTime,
      startDayOfWeek,
      endDayOfWeek,
      availabilities,
    );
  }

  private isTimeRangeWithinAvailability(
    startTime: Date,
    endTime: Date,
    startDayOfWeek: DayOfWeek,
    endDayOfWeek: DayOfWeek,
    availabilities: Availability[],
  ): boolean {
    const startTimeStr = this.dateToTimeString(startTime);
    const endTimeStr = this.dateToTimeString(endTime);

    if (startDayOfWeek === endDayOfWeek) {
      return availabilities.some((av) => {
        if (av.dayOfWeek === startDayOfWeek) {
          if (av.isOvernight) {
            return (
              this.timeToMinutes(startTimeStr) >=
              this.timeToMinutes(av.startTime)
            );
          } else {
            return (
              this.timeToMinutes(startTimeStr) >=
                this.timeToMinutes(av.startTime) &&
              this.timeToMinutes(endTimeStr) <= this.timeToMinutes(av.endTime)
            );
          }
        }

        if (av.dayOfWeek === PREVIOUS_DAY[startDayOfWeek] && av.isOvernight) {
          return (
            this.timeToMinutes(endTimeStr) <= this.timeToMinutes(av.endTime)
          );
        }

        return false;
      });
    }

    return availabilities.some((av) => {
      if (!av.isOvernight) return false;
      if (av.dayOfWeek !== startDayOfWeek) return false;
      if (NEXT_DAY[av.dayOfWeek] !== endDayOfWeek) return false;

      return (
        this.timeToMinutes(startTimeStr) >= this.timeToMinutes(av.startTime) &&
        this.timeToMinutes(endTimeStr) <= this.timeToMinutes(av.endTime)
      );
    });
  }

  private validateNoOverlaps(availabilities: ICreateAvailability[]): void {
    const slotsByDay = new Map<
      DayOfWeek,
      Array<{
        start: number;
        end: number;
        isOvernight: boolean;
        nextDayEnd?: number;
      }>
    >();

    for (const av of availabilities) {
      const startMins = this.timeToMinutes(av.startTime);
      const endMins = this.timeToMinutes(av.endTime);

      const existing = slotsByDay.get(av.dayOfWeek) || [];
      if (av.isOvernight) {
        existing.push({
          start: startMins,
          end: 24 * 60,
          isOvernight: true,
          nextDayEnd: endMins,
        });
      } else {
        existing.push({ start: startMins, end: endMins, isOvernight: false });
      }
      slotsByDay.set(av.dayOfWeek, existing);

      if (av.isOvernight) {
        const nextDay = NEXT_DAY[av.dayOfWeek];
        const nextDaySlots = slotsByDay.get(nextDay) || [];
        nextDaySlots.push({ start: 0, end: endMins, isOvernight: false });
        slotsByDay.set(nextDay, nextDaySlots);
      }
    }

    for (const [day, slots] of slotsByDay) {
      if (slots.length < 2) continue;

      const sorted = [...slots].sort((a, b) => a.start - b.start);

      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];

        if (next.start < current.end) {
          throw new BadRequestError(`Overlapping availability slots on ${day}`);
        }
      }
    }
  }

  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  private dateToDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    return days[date.getDay()];
  }

  private dateToTimeString(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }
}
