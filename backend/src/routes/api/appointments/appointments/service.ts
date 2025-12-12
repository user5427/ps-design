import type { FastifyInstance } from "fastify";
import type {
  CreateAppointmentBody,
  UpdateAppointmentBody,
  AppointmentResponse,
  AppointmentFilterQuery,
  AppointmentStatus,
} from "@ps-design/schemas/appointments/appointment";
import type { Appointment } from "@/modules/appointments/appointment/appointment.entity";

function toAppointmentResponse(appointment: Appointment): AppointmentResponse {
  return {
    id: appointment.id,
    customerName: appointment.customerName,
    customerPhone: appointment.customerPhone,
    customerEmail: appointment.customerEmail,
    startTime: appointment.startTime.toISOString(),
    status: appointment.status as AppointmentStatus,
    notes: appointment.notes,
    service: {
      id: appointment.service.id,
      price: appointment.service.serviceDefinition.price,
      baseDuration: appointment.service.serviceDefinition.baseDuration,
      employee: {
        id: appointment.service.employee.id,
        name: appointment.service.employee.name,
        email: appointment.service.employee.email,
      },
      serviceDefinition: {
        id: appointment.service.serviceDefinition.id,
        name: appointment.service.serviceDefinition.name,
        description: appointment.service.serviceDefinition.description,
        category: appointment.service.serviceDefinition.category
          ? {
              id: appointment.service.serviceDefinition.category.id,
              name: appointment.service.serviceDefinition.category.name,
            }
          : null,
      },
    },
    createdById: appointment.createdById,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}

export async function getAllAppointments(
  fastify: FastifyInstance,
  businessId: string,
  filter?: AppointmentFilterQuery,
): Promise<AppointmentResponse[]> {
  const appointments = await fastify.db.appointment.findAllByBusinessId(
    businessId,
    filter
      ? {
          serviceId: filter.serviceId,
          employeeId: filter.eployeeId, // Note: typo in schema
          status:
            filter.status as unknown as import("@/modules/appointments/appointment/appointment.entity").AppointmentStatus[],
          startTimeFrom: filter.startTimeFrom
            ? new Date(filter.startTimeFrom)
            : undefined,
          startTimeTo: filter.startTimeTo
            ? new Date(filter.startTimeTo)
            : undefined,
        }
      : undefined,
  );
  return appointments.map(toAppointmentResponse);
}

export async function createAppointment(
  fastify: FastifyInstance,
  businessId: string,
  createdById: string,
  input: CreateAppointmentBody,
): Promise<void> {
  await fastify.db.appointment.create({
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    startTime: new Date(input.startTime),
    notes: input.notes,
    serviceId: input.serviceId,
    businessId,
    createdById,
  });
}

export async function getAppointmentById(
  fastify: FastifyInstance,
  businessId: string,
  appointmentId: string,
): Promise<AppointmentResponse> {
  const appointment = await fastify.db.appointment.getById(
    appointmentId,
    businessId,
  );
  return toAppointmentResponse(appointment);
}

export async function updateAppointment(
  fastify: FastifyInstance,
  businessId: string,
  appointmentId: string,
  input: UpdateAppointmentBody,
): Promise<void> {
  await fastify.db.appointment.update(appointmentId, businessId, {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    startTime: input.startTime ? new Date(input.startTime) : undefined,
    notes: input.notes,
  });
}

export async function updateAppointmentStatus(
  fastify: FastifyInstance,
  businessId: string,
  appointmentId: string,
  status: AppointmentStatus,
): Promise<AppointmentResponse> {
  const updated = await fastify.db.appointment.updateStatus(
    appointmentId,
    businessId,
    status as import("@/modules/appointments/appointment/appointment.entity").AppointmentStatus,
  );
  return toAppointmentResponse(updated);
}
