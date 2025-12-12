import type { AppointmentStatus } from "./appointment.entity";

export interface IAppointment {
  id: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  startTime: Date;
  status: AppointmentStatus;
  notes: string | null;
  businessId: string;
  serviceId: string;
  createdById: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateAppointment {
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  startTime: Date;
  notes?: string | null;
  businessId: string;
  serviceId: string;
  createdById: string;
}

export interface IUpdateAppointment {
  customerName?: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  startTime?: Date;
  notes?: string | null;
}

export interface IAppointmentFilter {
  serviceId?: string;
  employeeId?: string;
  status?: AppointmentStatus[];
  startTimeFrom?: Date;
  startTimeTo?: Date;
}
