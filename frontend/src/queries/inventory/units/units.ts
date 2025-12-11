import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProductUnits,
  createProductUnit,
  updateProductUnit,
  bulkDeleteProductUnits,
} from "@/api/inventory/units";
import type {
  CreateProductUnitBody,
  UpdateProductUnitBody,
} from "@ps-design/schemas/inventory/product-unit";

export const PRODUCT_UNITS_QUERY_KEY = ["productUnits"];

export function useProductUnits() {
  return useQuery({
    queryKey: PRODUCT_UNITS_QUERY_KEY,
    queryFn: async () => {
      return getProductUnits();
    },
  });
}

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
