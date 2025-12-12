import { useQuery } from "@tanstack/react-query";
import {
  getStockLevel,
} from "@/api/inventory/stock-level";

export const STOCK_LEVELS_QUERY_KEY = ["stockLevels"];

export function useStockLevel(productId: string) {
  return useQuery({
    queryKey: [...STOCK_LEVELS_QUERY_KEY, productId],
    queryFn: async () => {
      return getStockLevel(productId);
    },
  });
}
