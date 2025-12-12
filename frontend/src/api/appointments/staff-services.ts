import { apiClient } from "@/api/client";
import type {
  CreateServiceBody,
  StaffServiceResponse,
  UpdateServiceBody,
} from "@ps-design/schemas/appointments/service";

export async function getStaffServices(): Promise<StaffServiceResponse[]> {
  const response = await apiClient.get<StaffServiceResponse[]>(
    "/appointments/staff-services/",
  );
  return response.data;
}

export async function getStaffServiceById(
  id: string,
): Promise<StaffServiceResponse> {
  const response = await apiClient.get<StaffServiceResponse>(
    `/appointments/staff-services/${id}`,
  );
  return response.data;
}

export async function createStaffService(
  data: CreateServiceBody,
): Promise<StaffServiceResponse> {
  const response = await apiClient.post<StaffServiceResponse>(
    "/appointments/staff-services/",
    data,
  );
  return response.data;
}

export async function updateStaffService(
  id: string,
  data: UpdateServiceBody,
): Promise<StaffServiceResponse> {
  const response = await apiClient.put<StaffServiceResponse>(
    `/appointments/staff-services/${id}`,
    data,
  );
  return response.data;
}

export async function bulkDeleteStaffServices(ids: string[]): Promise<void> {
  await apiClient.post("/appointments/staff-services/bulk-delete", { ids });
}
