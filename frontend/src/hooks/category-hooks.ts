import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkDeleteCategories,
  createCategory,
  getCategories,
  updateCategory,
  assignTaxToCategory,
  removeTaxFromCategory,
} from "@/api/categories";
import type {
  CreateCategoryBody,
  UpdateCategoryBody,
} from "@ps-design/schemas/category";

export const categoryKeys = {
  all: ["categories"] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: getCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryBody) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryBody }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useBulkDeleteCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteCategories(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useAssignTaxToCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, taxId }: { categoryId: string; taxId: string }) =>
      assignTaxToCategory(categoryId, taxId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useRemoveTaxFromCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => removeTaxFromCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}