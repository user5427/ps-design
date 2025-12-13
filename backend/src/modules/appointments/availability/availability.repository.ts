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

  /**
   * Generate time slots for a specific date, showing availability and appointments
   */
  async getAvailableTimeSlots(params: {
    businessId: string;
    date: Date;
    employeeId?: string;
    staffServiceId?: string;
    serviceDefinitionId?: string;
    durationMinutes?: number;
  }): Promise<
    Array<{
      startTime: Date;
      endTime: Date;
      isAvailable: boolean;
      employeeId: string;
      employeeName: string;
      staffServiceId: string | null;
      appointmentId: string | null;
    }>
  > {
    const slots: Array<{
      startTime: Date;
      endTime: Date;
      isAvailable: boolean;
      employeeId: string;
      employeeName: string;
      staffServiceId: string | null;
      appointmentId: string | null;
    }> = [];

    // Get relevant employees and their staff services based on filters
    const employeeStaffServiceMap: Map<string, string> = new Map();

    if (params.employeeId) {
      employeeStaffServiceMap.set(
        params.employeeId,
        params.staffServiceId || "",
      );
    } else if (params.staffServiceId) {
      const staffService = await this.dataSource
        .getRepository("StaffService")
        .findOne({
          where: { id: params.staffServiceId, businessId: params.businessId },
          relations: ["employee"],
        });
      if (staffService) {
        employeeStaffServiceMap.set(staffService.employeeId, staffService.id);
      }
    } else if (params.serviceDefinitionId) {
      const staffServices = await this.dataSource
        .getRepository("StaffService")
        .find({
          where: {
            serviceDefinitionId: params.serviceDefinitionId,
            businessId: params.businessId,
            isDisabled: false,
            deletedAt: IsNull(),
          },
          relations: ["employee"],
        });
      staffServices.forEach((ss: any) => {
        employeeStaffServiceMap.set(ss.employeeId, ss.id);
      });
    }

    if (employeeStaffServiceMap.size === 0) {
      return slots;
    }

    const employeeIds = Array.from(employeeStaffServiceMap.keys());

    const slotDuration = params.durationMinutes || 30;
    const dayOfWeek = this.dateToDayOfWeek(params.date);

    // For each employee, generate time slots based on their availability
    for (const employeeId of employeeIds) {
      const availabilities = await this.findByUserId(
        employeeId,
        params.businessId,
      );
      const employee = await this.userRepository.findOne({
        where: { id: employeeId },
        select: ["id", "name"],
      });

      if (!employee) continue;

      const dayAvailabilities = availabilities.filter(
        (av) => av.dayOfWeek === dayOfWeek,
      );

      // Get appointments for this employee on this date
      const startOfDay = new Date(params.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(params.date);
      endOfDay.setHours(23, 59, 59, 999);

      const appointments = await this.dataSource
        .getRepository("Appointment")
        .createQueryBuilder("appointment")
        .leftJoinAndSelect("appointment.service", "service")
        .leftJoinAndSelect("service.serviceDefinition", "serviceDefinition")
        .where("service.employeeId = :employeeId", { employeeId })
        .andWhere("appointment.businessId = :businessId", {
          businessId: params.businessId,
        })
        .andWhere("appointment.startTime >= :startOfDay", { startOfDay })
        .andWhere("appointment.startTime <= :endOfDay", { endOfDay })
        .andWhere("appointment.status != :cancelled", {
          cancelled: "CANCELLED",
        })
        .getMany();

      // Generate slots for each availability window
      for (const av of dayAvailabilities) {
        const [startHour, startMin] = av.startTime.split(":").map(Number);
        const [endHour, endMin] = av.endTime.split(":").map(Number);

        let currentTime = new Date(params.date);
        currentTime.setHours(startHour, startMin, 0, 0);

        const endTime = new Date(params.date);
        if (av.isOvernight) {
          // For overnight slots, continue until end of day
          endTime.setHours(23, 59, 59, 999);
        } else {
          endTime.setHours(endHour, endMin, 0, 0);
        }

        while (currentTime < endTime) {
          const slotStart = new Date(currentTime);
          const slotEnd = new Date(
            currentTime.getTime() + slotDuration * 60 * 1000,
          );

          if (slotEnd > endTime) break;

          // Check if this slot overlaps with any appointment
          const overlappingAppointment = appointments.find((appt: any) => {
            const apptStart = new Date(appt.startTime);
            const apptEnd = new Date(
              apptStart.getTime() +
                appt.service.serviceDefinition.baseDuration * 60 * 1000,
            );
            return slotStart < apptEnd && slotEnd > apptStart;
          });

          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            isAvailable: !overlappingAppointment,
            employeeId: employee.id,
            employeeName: employee.name,
            staffServiceId: employeeStaffServiceMap.get(employeeId) || null,
            appointmentId: overlappingAppointment
              ? overlappingAppointment.id
              : null,
          });

          currentTime = new Date(
            currentTime.getTime() + slotDuration * 60 * 1000,
          );
        }
      }
    }

    return slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  /**
   * Get availability blocks showing continuous free/occupied periods
   * This allows flexible appointment scheduling within free blocks
   */
  async getAvailabilityBlocks(params: {
    businessId: string;
    date: Date;
    employeeId?: string;
    staffServiceId?: string;
    serviceDefinitionId?: string;
  }): Promise<
    Array<{
      startTime: Date;
      endTime: Date;
      type: "FREE" | "OCCUPIED";
      employeeId: string;
      employeeName: string;
      staffServiceId: string | null;
      appointmentId: string | null;
    }>
  > {
    const blocks: Array<{
      startTime: Date;
      endTime: Date;
      type: "FREE" | "OCCUPIED";
      employeeId: string;
      employeeName: string;
      staffServiceId: string | null;
      appointmentId: string | null;
    }> = [];

    // Get relevant employees and their staff services based on filters
    const employeeStaffServiceMap: Map<string, string> = new Map();

    if (params.employeeId) {
      employeeStaffServiceMap.set(
        params.employeeId,
        params.staffServiceId || "",
      );
    } else if (params.staffServiceId) {
      const staffService = await this.dataSource
        .getRepository("StaffService")
        .findOne({
          where: { id: params.staffServiceId, businessId: params.businessId },
          relations: ["employee"],
        });
      if (staffService) {
        employeeStaffServiceMap.set(staffService.employeeId, staffService.id);
      }
    } else if (params.serviceDefinitionId) {
      const staffServices = await this.dataSource
        .getRepository("StaffService")
        .find({
          where: {
            serviceDefinitionId: params.serviceDefinitionId,
            businessId: params.businessId,
            isDisabled: false,
            deletedAt: IsNull(),
          },
          relations: ["employee"],
        });
      staffServices.forEach((ss: any) => {
        employeeStaffServiceMap.set(ss.employeeId, ss.id);
      });
    }

    if (employeeStaffServiceMap.size === 0) {
      return blocks;
    }

    const employeeIds = Array.from(employeeStaffServiceMap.keys());
    const dayOfWeek = this.dateToDayOfWeek(params.date);

    // For each employee, generate blocks based on availability and appointments
    for (const employeeId of employeeIds) {
      const availabilities = await this.findByUserId(
        employeeId,
        params.businessId,
      );
      const employee = await this.userRepository.findOne({
        where: { id: employeeId },
        select: ["id", "name"],
      });

      if (!employee) continue;

      const dayAvailabilities = availabilities.filter(
        (av) => av.dayOfWeek === dayOfWeek,
      );

      // Get appointments for this employee on this date
      const startOfDay = new Date(params.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(params.date);
      endOfDay.setHours(23, 59, 59, 999);

      const appointments = await this.dataSource
        .getRepository("Appointment")
        .createQueryBuilder("appointment")
        .leftJoinAndSelect("appointment.service", "service")
        .leftJoinAndSelect("service.serviceDefinition", "serviceDefinition")
        .where("service.employeeId = :employeeId", { employeeId })
        .andWhere("appointment.businessId = :businessId", {
          businessId: params.businessId,
        })
        .andWhere("appointment.startTime >= :startOfDay", { startOfDay })
        .andWhere("appointment.startTime <= :endOfDay", { endOfDay })
        .andWhere("appointment.status != :cancelled", {
          cancelled: "CANCELLED",
        })
        .getMany();

      // Process each availability window
      for (const av of dayAvailabilities) {
        const [startHour, startMin] = av.startTime.split(":").map(Number);
        const [endHour, endMin] = av.endTime.split(":").map(Number);

        const windowStart = new Date(params.date);
        windowStart.setHours(startHour, startMin, 0, 0);

        const windowEnd = new Date(params.date);
        if (av.isOvernight) {
          windowEnd.setHours(23, 59, 59, 999);
        } else {
          windowEnd.setHours(endHour, endMin, 0, 0);
        }

        // Get appointments within this window, sorted by start time
        const windowAppointments = appointments
          .filter((appt: any) => {
            const apptStart = new Date(appt.startTime);
            return apptStart >= windowStart && apptStart < windowEnd;
          })
          .sort(
            (a: any, b: any) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
          );

        let currentTime = windowStart;

        // Create blocks: free periods between appointments and occupied periods for appointments
        for (const appt of windowAppointments) {
          const apptStart = new Date(appt.startTime);
          const apptEnd = new Date(
            apptStart.getTime() +
              appt.service.serviceDefinition.baseDuration * 60 * 1000,
          );

          // Add free block before appointment if there's a gap
          if (currentTime < apptStart) {
            blocks.push({
              startTime: currentTime,
              endTime: apptStart,
              type: "FREE",
              employeeId: employee.id,
              employeeName: employee.name,
              staffServiceId: employeeStaffServiceMap.get(employeeId) || null,
              appointmentId: null,
            });
          }

          // Add occupied block for the appointment
          blocks.push({
            startTime: apptStart,
            endTime: apptEnd,
            type: "OCCUPIED",
            employeeId: employee.id,
            employeeName: employee.name,
            staffServiceId: employeeStaffServiceMap.get(employeeId) || null,
            appointmentId: appt.id,
          });

          currentTime = apptEnd;
        }

        // Add final free block if there's time remaining in the window
        if (currentTime < windowEnd) {
          blocks.push({
            startTime: currentTime,
            endTime: windowEnd,
            type: "FREE",
            employeeId: employee.id,
            employeeName: employee.name,
            staffServiceId: employeeStaffServiceMap.get(employeeId) || null,
            appointmentId: null,
          });
        }
      }
    }

    return blocks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }
}
