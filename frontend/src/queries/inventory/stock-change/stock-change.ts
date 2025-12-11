import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStockChanges,
  createStockChange,
  type GetStockChangesParams,
} from "@/api/inventory/stock-change";
import type {
  CreateStockChangeBody,
} from "@ps-design/schemas/inventory/stock-change";

export const STOCK_CHANGES_QUERY_KEY = ["stockChanges"];

export function useStockChanges(params?: GetStockChangesParams) {
  return useQuery({
    queryKey: [...STOCK_CHANGES_QUERY_KEY, params],
    queryFn: async () => {
      return getStockChanges(params);
    },
  });
}

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
