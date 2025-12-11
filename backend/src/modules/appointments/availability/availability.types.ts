import type { DayOfWeek } from "./availability.entity";

export interface IAvailability {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
  userId: string;
  businessId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateAvailability {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
}

export interface IBulkSetAvailability {
  userId: string;
  businessId: string;
  availabilities: ICreateAvailability[];
}
