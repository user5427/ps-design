import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createStockChange,
} from "@/api/inventory/stock-change";
import type {
  CreateStockChangeBody,
} from "@ps-design/schemas/inventory/stock-change";

export const STOCK_CHANGES_QUERY_KEY = ["stockChanges"];

export function useCreateStockChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStockChangeBody) => {
      return createStockChange(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: STOCK_CHANGES_QUERY_KEY,
      });
    },
  });
}
