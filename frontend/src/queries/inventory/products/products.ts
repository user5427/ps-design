import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  bulkDeleteProducts,
} from "@/api/inventory/products";
import type {
  CreateProductBody,
  UpdateProductBody,
} from "@ps-design/schemas/inventory/products";

export const PRODUCTS_QUERY_KEY = ["products"];

export function useProducts() {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: async () => {
      return getProducts();
    },
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, productId],
    queryFn: async () => {
      return getProduct(productId);
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductBody) => {
      return createProduct(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRODUCTS_QUERY_KEY,
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProductBody & { id: string }) => {
      return updateProduct(data.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRODUCTS_QUERY_KEY,
      });
    },
  });
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      return bulkDeleteProducts(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRODUCTS_QUERY_KEY,
      });
    },
  });
}
