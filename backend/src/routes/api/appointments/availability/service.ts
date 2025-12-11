import type { FastifyInstance } from "fastify";
import type {
  BulkSetAvailabilityBody,
  AvailabilityResponse,
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
