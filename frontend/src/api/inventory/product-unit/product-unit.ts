import { apiClient } from "@/api/client";
import type {
  CreateProductUnitBody,
  ProductUnitResponse,
  UpdateProductUnitBody,
} from "@ps-design/schemas/inventory/product-unit";

export async function createProductUnit(
  data: CreateProductUnitBody,
): Promise<ProductUnitResponse> {
  const response = await apiClient.post<ProductUnitResponse>(
    "/inventory/product-unit/",
    data,
  );
  return response.data;
}

export async function updateProductUnit(
  id: string,
  data: UpdateProductUnitBody,
): Promise<ProductUnitResponse> {
  const response = await apiClient.put<ProductUnitResponse>(
    `/inventory/product-unit/${id}`,
    data,
  );
  return response.data;
}

export async function bulkDeleteProductUnits(ids: string[]): Promise<void> {
  await apiClient.post("/inventory/product-unit/bulk-delete", { ids });
}
