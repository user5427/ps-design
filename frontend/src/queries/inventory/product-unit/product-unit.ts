import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProductUnit,
  updateProductUnit,
  bulkDeleteProductUnits,
} from "@/api/inventory/product-unit";
import type {
  CreateProductUnitBody,
  UpdateProductUnitBody,
} from "@ps-design/schemas/inventory/product-unit";

export const PRODUCT_UNITS_QUERY_KEY = ["productUnits"];

export function useCreateProductUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductUnitBody) => {
      return createProductUnit(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRODUCT_UNITS_QUERY_KEY,
      });
    },
  });
}

export function useUpdateProductUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProductUnitBody & { id: string }) => {
      return updateProductUnit(data.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRODUCT_UNITS_QUERY_KEY,
      });
    },
  });
}

export function useBulkDeleteProductUnits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      return bulkDeleteProductUnits(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRODUCT_UNITS_QUERY_KEY,
      });
    },
  });
}
