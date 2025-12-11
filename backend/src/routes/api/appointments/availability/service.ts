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
    startTimeLocal: availability.startTimeLocal,
    endTimeLocal: availability.endTimeLocal,
    serviceId: availability.serviceId,
    createdAt: availability.createdAt.toISOString(),
    updatedAt: availability.updatedAt.toISOString(),
  };
}

export async function getAvailabilityByServiceId(
  fastify: FastifyInstance,
  serviceId: string,
): Promise<AvailabilityResponse[]> {
  const availabilities =
    await fastify.db.availability.findByServiceId(serviceId);
  return availabilities.map(toAvailabilityResponse);
}

export async function bulkSetAvailability(
  fastify: FastifyInstance,
  businessId: string,
  serviceId: string,
  input: BulkSetAvailabilityBody,
): Promise<AvailabilityResponse[]> {
  const availabilities = await fastify.db.availability.bulkSetForService(
    {
      serviceId,
      availabilities: input.availabilities,
    },
    businessId,
  );

  return availabilities.map(toAvailabilityResponse);
}
