import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStockChange,
  getStockChanges,
  getStockLevels,
  type GetStockChangesParams,
} from "@/api/inventory";
import type { CreateStockChange } from "@/schemas/inventory";

export const stockKeys = {
  all: ["inventory"] as const,
  stockLevels: () => [...stockKeys.all, "stock-levels"] as const,
  stockChanges: (params?: GetStockChangesParams) =>
    [...stockKeys.all, "stock-changes", params] as const,
};

export function useStockLevels() {
  return useQuery({
    queryKey: stockKeys.stockLevels(),
    queryFn: getStockLevels,
  });
}

export function useStockChanges(params?: GetStockChangesParams) {
  return useQuery({
    queryKey: stockKeys.stockChanges(params),
    queryFn: () => getStockChanges(params),
  });
}

export function useCreateStockChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStockChange) => createStockChange(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.stockChanges() });
      queryClient.invalidateQueries({ queryKey: stockKeys.stockLevels() });
    },
  });
}
