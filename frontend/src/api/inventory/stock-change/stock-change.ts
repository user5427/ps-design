import { apiClient } from "@/api/client";
import type {
  CreateStockChangeBody,
  StockChangeResponse,
} from "@ps-design/schemas/inventory/stock-change";

export async function createStockChange(
  data: CreateStockChangeBody,
): Promise<StockChangeResponse> {
  const response = await apiClient.post<StockChangeResponse>(
    "/inventory/stock-change/",
    data,
  );
  return response.data;
}
