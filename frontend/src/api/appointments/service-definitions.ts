import { apiClient } from "@/api/client";
import type {
  CreateServiceDefinitionBody,
  ServiceDefinitionResponse,
  UpdateServiceDefinitionBody,
} from "@ps-design/schemas/appointments/service-definition";

export interface ServiceDefinitionFilters {
  active?: boolean;
}

export async function getServiceDefinitions(
  filters?: ServiceDefinitionFilters,
): Promise<ServiceDefinitionResponse[]> {
  const params = new URLSearchParams();
  if (filters?.active !== undefined) {
    params.set("active", String(filters.active));
  }
  const queryString = params.toString();
  const url = `/appointments/service-definitions/${queryString ? `?${queryString}` : ""}`;
  const response = await apiClient.get<ServiceDefinitionResponse[]>(url);
  return response.data;
}

export async function getServiceDefinitionById(
  id: string,
): Promise<ServiceDefinitionResponse> {
  const response = await apiClient.get<ServiceDefinitionResponse>(
    `/appointments/service-definitions/${id}`,
  );
  return response.data;
}

export async function createServiceDefinition(
  data: CreateServiceDefinitionBody,
): Promise<ServiceDefinitionResponse> {
  const response = await apiClient.post<ServiceDefinitionResponse>(
    "/appointments/service-definitions/",
    data,
  );
  return response.data;
}

export async function updateServiceDefinition(
  id: string,
  data: UpdateServiceDefinitionBody,
): Promise<ServiceDefinitionResponse> {
  const response = await apiClient.put<ServiceDefinitionResponse>(
    `/appointments/service-definitions/${id}`,
    data,
  );
  return response.data;
}

export async function bulkDeleteServiceDefinitions(
  ids: string[],
): Promise<void> {
  await apiClient.post("/appointments/service-definitions/bulk-delete", {
    ids,
  });
}
