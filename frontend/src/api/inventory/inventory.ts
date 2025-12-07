import { apiClient } from "@/api/client";
import type {
  CreateProduct,
  CreateProductUnit,
  CreateStockChange,
  Product,
  ProductUnit,
  StockChange,
  StockLevel,
  UpdateProduct,
  UpdateProductUnit,
} from "@/schemas/inventory";

// --- Product Units API ---
export async function getProductUnits(): Promise<ProductUnit[]> {
  const response = await apiClient.get<ProductUnit[]>("/inventory/units/");
  return response.data;
}

export async function createProductUnit(
  data: CreateProductUnit
): Promise<ProductUnit> {
  const response = await apiClient.post<ProductUnit>("/inventory/units/", data);
  return response.data;
}

export async function updateProductUnit(
  id: string,
  data: UpdateProductUnit
): Promise<ProductUnit> {
  const response = await apiClient.put<ProductUnit>(
    `/inventory/units/${id}`,
    data
  );
  return response.data;
}

export async function deleteProductUnit(id: string): Promise<void> {
  await apiClient.delete(`/inventory/units/${id}`);
}

// --- Products API ---
export async function getProducts(): Promise<Product[]> {
  const response = await apiClient.get<Product[]>("/inventory/products/");
  return response.data;
}

export async function getProduct(id: string): Promise<Product> {
  const response = await apiClient.get<Product>(`/inventory/products/${id}`);
  return response.data;
}

export async function createProduct(data: CreateProduct): Promise<Product> {
  const response = await apiClient.post<Product>("/inventory/products/", data);
  return response.data;
}

export async function updateProduct(
  id: string,
  data: UpdateProduct
): Promise<Product> {
  const response = await apiClient.put<Product>(
    `/inventory/products/${id}`,
    data
  );
  return response.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/inventory/products/${id}`);
}

// --- Stock Levels API ---
export async function getStockLevels(): Promise<StockLevel[]> {
  const response = await apiClient.get<StockLevel[]>("/inventory/stock/");
  return response.data;
}

export async function getStockLevel(productId: string): Promise<StockLevel> {
  const response = await apiClient.get<StockLevel>(
    `/inventory/stock/${productId}`
  );
  return response.data;
}

// --- Stock Changes API ---
export interface GetStockChangesParams {
  page?: number;
  limit?: number;
  productId?: string;
  type?: string;
}

export interface PaginatedStockChanges {
  data: StockChange[];
  total: number;
  page: number;
  limit: number;
}

export async function getStockChanges(
  params?: GetStockChangesParams
): Promise<PaginatedStockChanges> {
  const response = await apiClient.get<PaginatedStockChanges>(
    "/inventory/stock/changes",
    { params }
  );
  return response.data;
}

export async function createStockChange(
  data: CreateStockChange
): Promise<StockChange> {
  const response = await apiClient.post<StockChange>(
    "/inventory/stock/changes",
    data
  );
  return response.data;
}

export async function deleteStockChange(id: string): Promise<void> {
  await apiClient.delete(`/inventory/stock/changes/${id}`);
}
