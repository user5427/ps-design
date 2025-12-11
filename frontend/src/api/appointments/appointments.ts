import { apiClient } from "@/api/client";
import type {
  CreateAppointmentBody,
  UpdateAppointmentBody,
  AppointmentResponse,
  AppointmentStatus,
} from "@ps-design/schemas/appointments/appointment";

export interface AppointmentFilters {
  serviceId?: string;
  employeeId?: string;
  status?: AppointmentStatus[];
  startTimeFrom?: string;
  startTimeTo?: string;
}

export async function getAppointments(
  filters?: AppointmentFilters,
): Promise<AppointmentResponse[]> {
  const params = new URLSearchParams();

  if (filters?.serviceId) {
    params.set("serviceId", filters.serviceId);
  }
  if (filters?.employeeId) {
    params.set("eployeeId", filters.employeeId); // Note: typo matches schema
  }
  if (filters?.status && filters.status.length > 0) {
    for (const s of filters.status) {
      params.append("status", s);
    }
  }
  if (filters?.startTimeFrom) {
    params.set("startTimeFrom", filters.startTimeFrom);
  }
  if (filters?.startTimeTo) {
    params.set("startTimeTo", filters.startTimeTo);
  }

  const queryString = params.toString();
  const url = `/appointments/appointments/${queryString ? `?${queryString}` : ""}`;
  const response = await apiClient.get<AppointmentResponse[]>(url);
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
