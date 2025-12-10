import { apiClient } from "@/api/client";
import type {
  CreateMenuItemBody,
  MenuItemResponse,
  UpdateMenuItemBody,
} from "@ps-design/schemas/menu/items";

export async function getMenuItems(): Promise<MenuItemResponse[]> {
  const response = await apiClient.get<MenuItemResponse[]>("/menu/items/");
  return response.data;
}

export async function getMenuItemById(id: string): Promise<MenuItemResponse> {
  const response = await apiClient.get<MenuItemResponse>(`/menu/items/${id}`);
  return response.data;
}

export async function createMenuItem(
  data: CreateMenuItemBody,
): Promise<MenuItemResponse> {
  const response = await apiClient.post<MenuItemResponse>("/menu/items/", data);
  return response.data;
}

export async function updateMenuItem(
  id: string,
  data: UpdateMenuItemBody,
): Promise<MenuItemResponse> {
  const response = await apiClient.put<MenuItemResponse>(
    `/menu/items/${id}`,
    data,
  );
  return response.data;
}

export async function bulkDeleteMenuItems(ids: string[]): Promise<void> {
  await apiClient.post("/menu/items/bulk-delete", { ids });
}
