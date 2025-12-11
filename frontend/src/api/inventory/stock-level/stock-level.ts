import { apiClient } from "@/api/client";
import type {
  StockLevelResponse,
} from "@ps-design/schemas/inventory/stock-level";

export async function getStockLevel(
  productId: string,
): Promise<StockLevelResponse> {
  const response = await apiClient.get<StockLevelResponse>(
    `/inventory/stock/${productId}`,
  );
  return response.data;
}
