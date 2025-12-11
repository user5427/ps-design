import { useQuery } from "@tanstack/react-query";
import {
  getStockLevels,
  getStockLevel,
} from "@/api/inventory/stock-level";

export const STOCK_LEVELS_QUERY_KEY = ["stockLevels"];

export function useStockLevels() {
  return useQuery({
    queryKey: STOCK_LEVELS_QUERY_KEY,
    queryFn: async () => {
      return getStockLevels();
    },
  });
}

export function useStockLevel(productId: string) {
  return useQuery({
    queryKey: [...STOCK_LEVELS_QUERY_KEY, productId],
    queryFn: async () => {
      return getStockLevel(productId);
    },
  });
}
