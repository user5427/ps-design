import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStockLevels,
  getStockLevel,
  getStockChanges,
  createStockChange,
  type GetStockChangesParams,
} from "@/api/inventory/stock";
import type {
  CreateStockChangeBody,
} from "@ps-design/schemas/inventory/stock";

export const STOCK_LEVELS_QUERY_KEY = ["stockLevels"];
export const STOCK_CHANGES_QUERY_KEY = ["stockChanges"];

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
        queryKey: STOCK_LEVELS_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: STOCK_CHANGES_QUERY_KEY,
      });
    },
  });
}
