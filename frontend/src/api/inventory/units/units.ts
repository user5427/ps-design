import { apiClient } from "@/api/client";
import type {
  CreateProductUnitBody,
  ProductUnitResponse,
  UpdateProductUnitBody,
} from "@ps-design/schemas/inventory/units";

export async function getProductUnits(): Promise<ProductUnitResponse[]> {
  const response =
    await apiClient.get<ProductUnitResponse[]>("/inventory/units/");
  return response.data;
}

export async function createProductUnit(
  data: CreateProductUnitBody,
): Promise<ProductUnitResponse> {
  const response = await apiClient.post<ProductUnitResponse>(
    "/inventory/units/",
    data,
  );
  return response.data;
}

export async function updateProductUnit(
  id: string,
  data: UpdateProductUnitBody,
): Promise<ProductUnitResponse> {
  const response = await apiClient.put<ProductUnitResponse>(
    `/inventory/units/${id}`,
    data,
  );
  return response.data;
}

export async function bulkDeleteProductUnits(ids: string[]): Promise<void> {
  await apiClient.post("/inventory/units/bulk-delete", { ids });
}
