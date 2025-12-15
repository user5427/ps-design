import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getApplicableOrderDiscount,
  getApplicableServiceDiscount,
  getServiceDiscounts,
  createServiceDiscount,
  updateServiceDiscount,
  deleteServiceDiscount,
  getMenuDiscounts,
  createMenuDiscount,
  updateMenuDiscount,
  deleteMenuDiscount,
} from "@/api/discounts";
import type {
  CreateServiceDiscountBody,
  UpdateServiceDiscountBody,
  CreateMenuDiscountBody,
  UpdateMenuDiscountBody,
} from "@ps-design/schemas/discount";

export const discountKeys = {
  all: ["discounts"] as const,
  list: () => [...discountKeys.all] as const,
  applicable: {
    order: (menuItemIds: string[], orderTotal: number) =>
      [
        ...discountKeys.all,
        "applicable",
        "order",
        menuItemIds,
        orderTotal,
      ] as const,
    service: (serviceDefinitionId: string, servicePrice: number) =>
      [
        ...discountKeys.all,
        "applicable",
        "service",
        serviceDefinitionId,
        servicePrice,
      ] as const,
  },
};

export function useApplicableOrderDiscount(
  menuItemIds: string[],
  orderTotal: number,
  enabled = true,
) {
  return useQuery({
    queryKey: discountKeys.applicable.order(menuItemIds, orderTotal),
    queryFn: () => getApplicableOrderDiscount(menuItemIds, orderTotal),
    enabled: enabled && menuItemIds.length > 0 && orderTotal > 0,
  });
}

export function useApplicableServiceDiscount(
  serviceDefinitionId: string,
  servicePrice: number,
  enabled = true,
) {
  return useQuery({
    queryKey: discountKeys.applicable.service(
      serviceDefinitionId,
      servicePrice,
    ),
    queryFn: () =>
      getApplicableServiceDiscount(serviceDefinitionId, servicePrice),
    enabled: enabled && !!serviceDefinitionId && servicePrice > 0,
  });
}

// Service Discounts Hooks

export function useServiceDiscounts() {
  return useQuery({
    queryKey: [...discountKeys.list(), "service"],
    queryFn: () => getServiceDiscounts(),
  });
}

export function useCreateServiceDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceDiscountBody) =>
      createServiceDiscount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
    },
  });
}

export function useUpdateServiceDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateServiceDiscountBody;
    }) => updateServiceDiscount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
    },
  });
}

export function useDeleteServiceDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteServiceDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
    },
  });
}

// Menu Discounts Hooks

export function useMenuDiscounts() {
  return useQuery({
    queryKey: [...discountKeys.list(), "menu"],
    queryFn: () => getMenuDiscounts(),
  });
}

export function useCreateMenuDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuDiscountBody) => createMenuDiscount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
    },
  });
}

export function useUpdateMenuDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuDiscountBody }) =>
      updateMenuDiscount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
    },
  });
}

export function useDeleteMenuDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMenuDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
    },
  });
}
