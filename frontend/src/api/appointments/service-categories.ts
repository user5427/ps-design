import { apiClient } from "@/api/client";
import type {
  CreateServiceCategoryBody,
  ServiceCategoryResponse,
  UpdateServiceCategoryBody,
} from "@ps-design/schemas/appointments/service-category";

export async function getServiceCategories(): Promise<
  ServiceCategoryResponse[]
> {
  const response = await apiClient.get<ServiceCategoryResponse[]>(
    "/appointments/service-categories/",
  );
  return response.data;
}

export async function getServiceCategoryById(
  id: string,
): Promise<ServiceCategoryResponse> {
  const response = await apiClient.get<ServiceCategoryResponse>(
    `/appointments/service-categories/${id}`,
  );
  return response.data;
}

export async function createServiceCategory(
  data: CreateServiceCategoryBody,
): Promise<ServiceCategoryResponse> {
  const response = await apiClient.post<ServiceCategoryResponse>(
    "/appointments/service-categories/",
    data,
  );
  return response.data;
}

export async function updateServiceCategory(
  id: string,
  data: UpdateServiceCategoryBody,
): Promise<ServiceCategoryResponse> {
  const response = await apiClient.put<ServiceCategoryResponse>(
    `/appointments/service-categories/${id}`,
    data,
  );
  return response.data;
}

export async function bulkDeleteServiceCategories(
  ids: string[],
): Promise<void> {
  await apiClient.post("/appointments/service-categories/bulk-delete", { ids });
}
