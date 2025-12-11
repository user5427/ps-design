import { apiClient } from "@/api/client";
import type {
  CreateStockChangeBody,
  StockChangeResponse,
} from "@ps-design/schemas/inventory/stock-change";

export interface GetStockChangesParams {
  page?: number;
  limit?: number;
  productId?: string;
  type?: string;
}

export async function getStockChanges(
  params?: GetStockChangesParams,
): Promise<StockChangeResponse[]> {
  const response = await apiClient.get<StockChangeResponse[]>(
    "/inventory/stock/changes",
    { params },
  );
  return response.data;
}

export async function createStockChange(
  data: CreateStockChangeBody,
): Promise<StockChangeResponse> {
  const response = await apiClient.post<StockChangeResponse>(
    "/inventory/stock/changes",
    data,
  );
  return response.data;
}
