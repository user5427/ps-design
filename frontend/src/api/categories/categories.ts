import { apiClient } from "@/api/client";
import type {
  CreateCategoryBody,
  CategoryResponse,
  UpdateCategoryBody,
} from "@ps-design/schemas/category";

export async function getCategories(): Promise<CategoryResponse[]> {
  const response = await apiClient.get<CategoryResponse[]>("/categories/");
  return response.data;
}

export async function getCategoryById(id: string): Promise<CategoryResponse> {
  const response = await apiClient.get<CategoryResponse>(`/categories/${id}`);
  return response.data;
}

export async function createCategory(
  data: CreateCategoryBody,
): Promise<CategoryResponse> {
  const response = await apiClient.post<CategoryResponse>("/categories/", data);
  return response.data;
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryBody,
): Promise<CategoryResponse> {
  const response = await apiClient.put<CategoryResponse>(
    `/categories/${id}`,
    data,
  );
  return response.data;
}

export async function bulkDeleteCategories(ids: string[]): Promise<void> {
  await apiClient.post("/categories/bulk-delete", { ids });
}
