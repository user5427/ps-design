import type { FastifyInstance } from "fastify";
import type {
  BulkSetAvailabilityBody,
  AvailabilityResponse,
  GetAvailableTimeSlotsQuery,
  AvailableTimeSlotsResponse,
  TimeSlot,
  GetAvailabilityBlocksQuery,
  AvailabilityBlocksResponse,
  AvailabilityBlock,
} from "@ps-design/schemas/appointments/availability";
import type { Availability } from "@/modules/appointments/availability/availability.entity";

function toAvailabilityResponse(
  availability: Availability,
): AvailabilityResponse {
  return {
    id: availability.id,
    dayOfWeek: availability.dayOfWeek,
    startTime: availability.startTime,
    endTime: availability.endTime,
    isOvernight: availability.isOvernight,
    userId: availability.userId,
    businessId: availability.businessId,
    createdAt: availability.createdAt.toISOString(),
    updatedAt: availability.updatedAt.toISOString(),
  };
}

export async function getAvailabilityByUserId(
  fastify: FastifyInstance,
  userId: string,
  businessId: string,
): Promise<AvailabilityResponse[]> {
  const availabilities = await fastify.db.availability.findByUserId(
    userId,
    businessId,
  );
  return availabilities.map(toAvailabilityResponse);
}

export async function bulkSetAvailability(
  fastify: FastifyInstance,
  businessId: string,
  userId: string,
  input: BulkSetAvailabilityBody,
): Promise<void> {
  await fastify.db.availability.bulkSetForUser({
    userId,
    businessId,
    availabilities: input.availabilities,
  });
}

export async function getAvailableTimeSlots(
  fastify: FastifyInstance,
  businessId: string,
  query: GetAvailableTimeSlotsQuery,
): Promise<AvailableTimeSlotsResponse> {
  const date = new Date(query.date);

  const slots = await fastify.db.availability.getAvailableTimeSlots({
    businessId,
    date,
    employeeId: query.employeeId,
    staffServiceId: query.staffServiceId,
    serviceDefinitionId: query.serviceDefinitionId,
    durationMinutes: query.durationMinutes || 30,
  });

  const timeSlots: TimeSlot[] = slots.map((slot) => ({
    startTime: slot.startTime.toISOString(),
    endTime: slot.endTime.toISOString(),
    isAvailable: slot.isAvailable,
    appointmentId: slot.appointmentId,
    employeeId: slot.employeeId,
    employeeName: slot.employeeName,
    staffServiceId: slot.staffServiceId,
  }));

  return {
    date: date.toISOString(),
    slots: timeSlots,
  };
}

export async function getAvailabilityBlocks(
  fastify: FastifyInstance,
  businessId: string,
  query: GetAvailabilityBlocksQuery,
): Promise<AvailabilityBlocksResponse> {
  const date = new Date(query.date);

  const blocks = await fastify.db.availability.getAvailabilityBlocks({
    businessId,
    date,
    employeeId: query.employeeId,
    staffServiceId: query.staffServiceId,
    serviceDefinitionId: query.serviceDefinitionId,
  });

  const availabilityBlocks: AvailabilityBlock[] = blocks.map((block) => ({
    startTime: block.startTime.toISOString(),
    endTime: block.endTime.toISOString(),
    type: block.type,
    employeeId: block.employeeId,
    employeeName: block.employeeName,
    staffServiceId: block.staffServiceId,
    appointmentId: block.appointmentId,
  }));

  return {
    date: date.toISOString(),
    blocks: availabilityBlocks,
  };
}
