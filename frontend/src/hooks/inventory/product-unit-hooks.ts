import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkDeleteProductUnits,
  createProductUnit,
  getProductUnits,
  updateProductUnit,
} from "@/api/inventory";
import type { CreateProductUnit, UpdateProductUnit } from "@/schemas/inventory";

export const productUnitKeys = {
  all: ["inventory", "units"] as const,
};

export function useProductUnits() {
  return useQuery({
    queryKey: productUnitKeys.all,
    queryFn: getProductUnits,
  });
}

export function useCreateProductUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductUnit) => createProductUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productUnitKeys.all });
    },
  });
}

export function useUpdateProductUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductUnit }) =>
      updateProductUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productUnitKeys.all });
    },
  });
}

export function useBulkDeleteProductUnits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteProductUnits(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productUnitKeys.all });
    },
  });
}
