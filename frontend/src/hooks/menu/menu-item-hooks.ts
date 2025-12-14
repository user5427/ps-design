import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkDeleteMenuItems,
  createMenuItem,
  getMenuItemById,
  getMenuItems,
  updateMenuItem,
} from "@/api/menu";
import type {
  CreateMenuItemBody,
  UpdateMenuItemBody,
} from "@ps-design/schemas/menu/items";
import { categoryKeys } from "@/hooks/category-hooks";

export const menuItemKeys = {
  all: ["menu", "items"] as const,
  detail: (id: string) => ["menu", "items", id] as const,
};

export function useMenuItems() {
  return useQuery({
    queryKey: menuItemKeys.all,
    queryFn: getMenuItems,
  });
}

export function useMenuItemById(id: string) {
  return useQuery({
    queryKey: menuItemKeys.detail(id),
    queryFn: () => getMenuItemById(id),
    enabled: !!id,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuItemBody) => createMenuItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuItemKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuItemBody }) =>
      updateMenuItem(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: menuItemKeys.all });
      queryClient.invalidateQueries({
        queryKey: menuItemKeys.detail(variables.id),
      });
    },
  });
}

export function useBulkDeleteMenuItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteMenuItems(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuItemKeys.all });
    },
  });
}
