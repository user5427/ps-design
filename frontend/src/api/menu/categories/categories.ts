import { apiClient } from "@/api/client";
import type {
  CreateMenuItemCategoryBody,
  MenuItemCategoryResponse,
  UpdateMenuItemCategoryBody,
} from "@ps-design/schemas/menu/category";

export async function getMenuItemCategories(): Promise<MenuItemCategoryResponse[]> {
  const response = await apiClient.get<MenuItemCategoryResponse[]>("/menu/categories/");
  return response.data;
}

export async function createMenuItemCategory(
  data: CreateMenuItemCategoryBody
): Promise<MenuItemCategoryResponse> {
  const response = await apiClient.post<MenuItemCategoryResponse>("/menu/categories/", data);
  return response.data;
}

export async function updateMenuItemCategory(
  id: string,
  data: UpdateMenuItemCategoryBody
): Promise<MenuItemCategoryResponse> {
  const response = await apiClient.put<MenuItemCategoryResponse>(
    `/menu/categories/${id}`,
    data
  );
  return response.data;
}

export async function bulkDeleteMenuItemCategories(ids: string[]): Promise<void> {
  await apiClient.post("/menu/categories/bulk-delete", { ids });
}
