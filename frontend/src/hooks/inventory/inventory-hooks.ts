import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  createProductUnit,
  createStockChange,
  deleteProduct,
  deleteProductUnit,
  deleteStockChange,
  getProducts,
  getProductUnits,
  getStockChanges,
  getStockLevels,
  updateProduct,
  updateProductUnit,
  type GetStockChangesParams,
} from "@/api/inventory";
import type {
  CreateProduct,
  CreateProductUnit,
  CreateStockChange,
  UpdateProduct,
  UpdateProductUnit,
} from "@/schemas/inventory";

// Query keys
export const inventoryKeys = {
  all: ["inventory"] as const,
  units: () => [...inventoryKeys.all, "units"] as const,
  products: () => [...inventoryKeys.all, "products"] as const,
  stockLevels: () => [...inventoryKeys.all, "stock-levels"] as const,
  stockChanges: (params?: GetStockChangesParams) =>
    [...inventoryKeys.all, "stock-changes", params] as const,
};

// --- Product Units Hooks ---
export function useProductUnits() {
  return useQuery({
    queryKey: inventoryKeys.units(),
    queryFn: getProductUnits,
  });
}

export function useCreateProductUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductUnit) => createProductUnit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.units() });
    },
  });
}

export function useUpdateProductUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductUnit }) =>
      updateProductUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.units() });
    },
  });
}

export function useDeleteProductUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProductUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.units() });
    },
  });
}

// --- Products Hooks ---
export function useProducts() {
  return useQuery({
    queryKey: inventoryKeys.products(),
    queryFn: getProducts,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProduct) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stockLevels() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProduct }) =>
      updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stockLevels() });
    },
  });
}

// --- Stock Levels Hooks ---
export function useStockLevels() {
  return useQuery({
    queryKey: inventoryKeys.stockLevels(),
    queryFn: getStockLevels,
  });
}

// --- Stock Changes Hooks ---
export function useStockChanges(params?: GetStockChangesParams) {
  return useQuery({
    queryKey: inventoryKeys.stockChanges(params),
    queryFn: () => getStockChanges(params),
  });
}

export function useCreateStockChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStockChange) => createStockChange(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stockChanges() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stockLevels() });
    },
  });
}

export function useDeleteStockChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStockChange(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stockChanges() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stockLevels() });
    },
  });
}
