import { apiClient } from "@/api/client";
import type {
  CreateAppointmentBody,
  UpdateAppointmentBody,
  AppointmentResponse,
  AppointmentStatus,
  PayAppointmentBody,
  RefundAppointmentBody,
} from "@ps-design/schemas/appointments/appointment";

export async function getAppointments(): Promise<AppointmentResponse[]> {
  const response = await apiClient.get<AppointmentResponse[]>("/appointments/");
  return response.data;
}

export async function getAppointmentById(
  id: string,
): Promise<AppointmentResponse> {
  const response = await apiClient.get<AppointmentResponse>(
    `/appointments/${id}`,
  );
  return response.data;
}

export async function createAppointment(
  data: CreateAppointmentBody,
): Promise<AppointmentResponse> {
  const response = await apiClient.post<AppointmentResponse>(
    "/appointments/",
    data,
  );
  return response.data;
}

export async function updateAppointment(
  id: string,
  data: UpdateAppointmentBody,
): Promise<AppointmentResponse> {
  const response = await apiClient.put<AppointmentResponse>(
    `/appointments/${id}`,
    data,
  );
  return response.data;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<AppointmentResponse> {
  const response = await apiClient.patch<AppointmentResponse>(
    `/appointments/${id}/status`,
    { status },
  );
  return response.data;
}

export async function bulkDeleteAppointments(ids: string[]): Promise<void> {
  await apiClient.post("/appointments/bulk-delete", { ids });
}

export async function payAppointment(
  id: string,
  data: PayAppointmentBody,
): Promise<void> {
  await apiClient.post(`/appointments/${id}/pay`, data);
}

export async function refundAppointment(
  id: string,
  data: RefundAppointmentBody,
): Promise<void> {
  await apiClient.post(`/appointments/${id}/refund`, data);
}

export async function payAppointment(
  id: string,
  data: PayAppointmentBody,
): Promise<void> {
  await apiClient.post(`/appointments/appointments/${id}/pay`, data);
}

export async function refundAppointment(
  id: string,
  data: RefundAppointmentBody,
): Promise<void> {
  await apiClient.post(`/appointments/appointments/${id}/refund`, data);
}
