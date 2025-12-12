import { apiClient } from "@/api/client";
import type {
  BulkSetAvailabilityBody,
  AvailabilityResponse,
  GetAvailableTimeSlotsQuery,
  AvailableTimeSlotsResponse,
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

export async function getAvailableTimeSlots(
  query: GetAvailableTimeSlotsQuery,
): Promise<AvailableTimeSlotsResponse> {
  const params = new URLSearchParams();
  if (query.staffServiceId)
    params.append("staffServiceId", query.staffServiceId);
  if (query.serviceDefinitionId)
    params.append("serviceDefinitionId", query.serviceDefinitionId);
  if (query.employeeId) params.append("employeeId", query.employeeId);
  params.append("date", query.date);
  if (query.durationMinutes)
    params.append("durationMinutes", query.durationMinutes.toString());

  const response = await apiClient.get<AvailableTimeSlotsResponse>(
    `/appointments/availability/timeslots?${params.toString()}`,
  );
  return response.data;
}
