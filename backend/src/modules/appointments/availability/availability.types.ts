import type { DayOfWeek } from "./availability.entity";

export interface IAvailability {
  id: string;
  dayOfWeek: DayOfWeek;
  startTimeLocal: string;
  endTimeLocal: string;
  serviceId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateAvailability {
  dayOfWeek: DayOfWeek;
  startTimeLocal: string;
  endTimeLocal: string;
  serviceId: string;
}

export interface IBulkSetAvailability {
  serviceId: string;
  availabilities: Array<{
    dayOfWeek: DayOfWeek;
    startTimeLocal: string;
    endTimeLocal: string;
  }>;
}
