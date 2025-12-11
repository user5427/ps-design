import { apiClient } from "@/api/client";
import type {
  CreateProductBody,
  ProductResponse,
  UpdateProductBody,
} from "@ps-design/schemas/inventory/product";

export async function getProduct(id: string): Promise<ProductResponse> {
  const response = await apiClient.get<ProductResponse>(
    `/inventory/products/${id}`,
  );
  return response.data;
}

export async function createProduct(
  data: CreateProductBody,
): Promise<ProductResponse> {
  const response = await apiClient.post<ProductResponse>(
    "/inventory/products/",
    data,
  );
  return response.data;
}

export async function updateProduct(
  id: string,
  data: UpdateProductBody,
): Promise<ProductResponse> {
  const response = await apiClient.put<ProductResponse>(
    `/inventory/products/${id}`,
    data,
  );
  return response.data;
}

export async function bulkDeleteProducts(ids: string[]): Promise<void> {
  await apiClient.post("/inventory/products/bulk-delete", { ids });
}
