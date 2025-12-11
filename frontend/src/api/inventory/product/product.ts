import { apiClient } from "@/api/client";
import type {
  CreateProductBody,
  ProductResponse,
  UpdateProductBody,
} from "@ps-design/schemas/inventory/product";

export async function getProduct(id: string): Promise<ProductResponse> {
  const response = await apiClient.get<ProductResponse>(
    `/inventory/product/${id}`,
  );
  return response.data;
}

export async function createProduct(
  data: CreateProductBody,
): Promise<ProductResponse> {
  const response = await apiClient.post<ProductResponse>(
    "/inventory/product/",
    data,
  );
  return response.data;
}

export async function updateProduct(
  id: string,
  data: UpdateProductBody,
): Promise<ProductResponse> {
  const response = await apiClient.put<ProductResponse>(
    `/inventory/product/${id}`,
    data,
  );
  return response.data;
}

export async function bulkDeleteProducts(ids: string[]): Promise<void> {
  await apiClient.post("/inventory/product/bulk-delete", { ids });
}
