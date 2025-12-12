import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkDeleteMenuItemCategories,
  createMenuItemCategory,
  getMenuItemCategories,
  updateMenuItemCategory,
} from "@/api/menu";
import type {
  CreateMenuItemCategoryBody,
  UpdateMenuItemCategoryBody,
} from "@ps-design/schemas/menu/category";

export const menuCategoryKeys = {
  all: ["menu", "categories"] as const,
};

export function useMenuCategories() {
  return useQuery({
    queryKey: menuCategoryKeys.all,
    queryFn: getMenuItemCategories,
  });
}

export function useCreateMenuCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuItemCategoryBody) =>
      createMenuItemCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuCategoryKeys.all });
    },
  });
}

export function useUpdateMenuCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMenuItemCategoryBody;
    }) => updateMenuItemCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuCategoryKeys.all });
    },
  });
}

export function useBulkDeleteMenuCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteMenuItemCategories(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuCategoryKeys.all });
    },
  });
}
