import { apiClient } from "@/api/client";
import type {
  BulkSetAvailabilityBody,
  AvailabilityResponse,
} from "@ps-design/schemas/appointments/availability";

export async function getAvailabilityByServiceId(
  serviceId: string,
): Promise<AvailabilityResponse[]> {
  const response = await apiClient.get<AvailabilityResponse[]>(
    `/appointments/availability/staff-service/${serviceId}`,
  );
  return response.data;
}

export async function bulkSetAvailability(
  serviceId: string,
  data: BulkSetAvailabilityBody,
): Promise<AvailabilityResponse[]> {
  const response = await apiClient.put<AvailabilityResponse[]>(
    `/appointments/availability/staff-service/${serviceId}`,
    data,
  );
  return response.data;
}
