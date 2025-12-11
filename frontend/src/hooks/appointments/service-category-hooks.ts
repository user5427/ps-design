import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkDeleteServiceCategories,
  createServiceCategory,
  getServiceCategories,
  updateServiceCategory,
} from "@/api/appointments";
import type {
  CreateServiceCategoryBody,
  UpdateServiceCategoryBody,
} from "@ps-design/schemas/appointments/service-category";

export const serviceCategoryKeys = {
  all: ["appointments", "serviceCategories"] as const,
};

export function useServiceCategories() {
  return useQuery({
    queryKey: serviceCategoryKeys.all,
    queryFn: getServiceCategories,
  });
}

export function useCreateServiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceCategoryBody) => createServiceCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all });
    },
  });
}

export function useUpdateServiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateServiceCategoryBody;
    }) => updateServiceCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all });
    },
  });
}

export function useBulkDeleteServiceCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteServiceCategories(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all });
    },
  });
}
