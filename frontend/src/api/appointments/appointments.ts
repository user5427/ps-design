import { apiClient } from "@/api/client";
import type {
  CreateAppointmentBody,
  UpdateAppointmentBody,
  AppointmentResponse,
  AppointmentStatus,
} from "@ps-design/schemas/appointments/appointment";

export async function getAppointments(): Promise<AppointmentResponse[]> {
  const response = await apiClient.get<AppointmentResponse[]>(
    "/appointments/appointments/",
  );
  return response.data;
}

export async function getAppointmentById(
  id: string,
): Promise<AppointmentResponse> {
  const response = await apiClient.get<AppointmentResponse>(
    `/appointments/appointments/${id}`,
  );
  return response.data;
}

export async function createAppointment(
  data: CreateAppointmentBody,
): Promise<AppointmentResponse> {
  const response = await apiClient.post<AppointmentResponse>(
    "/appointments/appointments/",
    data,
  );
  return response.data;
}

export async function updateAppointment(
  id: string,
  data: UpdateAppointmentBody,
): Promise<AppointmentResponse> {
  const response = await apiClient.put<AppointmentResponse>(
    `/appointments/appointments/${id}`,
    data,
  );
  return response.data;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<AppointmentResponse> {
  const response = await apiClient.patch<AppointmentResponse>(
    `/appointments/appointments/${id}/status`,
    { status },
  );
  return response.data;
}

export async function bulkDeleteAppointments(ids: string[]): Promise<void> {
  await apiClient.post("/appointments/appointments/bulk-delete", { ids });
}
