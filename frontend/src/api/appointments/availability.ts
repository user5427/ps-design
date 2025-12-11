import { apiClient } from "@/api/client";
import type {
  BulkSetAvailabilityBody,
  AvailabilityResponse,
} from "@ps-design/schemas/appointments/availability";

export async function getAvailabilityByUserId(
  userId: string,
): Promise<AvailabilityResponse[]> {
  const response = await apiClient.get<AvailabilityResponse[]>(
    `/appointments/availability/user/${userId}`,
  );
  return response.data;
}

export async function bulkSetAvailability(
  userId: string,
  data: BulkSetAvailabilityBody,
): Promise<void> {
  await apiClient.put(`/appointments/availability/user/${userId}`, data);
}
