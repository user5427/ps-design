import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDiscount,
  deleteDiscount,
  getDiscounts,
  updateDiscount,
  getApplicableOrderDiscount,
  getApplicableServiceDiscount,
} from "@/api/discounts";
import type {
  CreateDiscountBody,
  UpdateDiscountBody,
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

export function useDiscounts() {
  return useQuery({
    queryKey: discountKeys.list(),
    queryFn: () => getDiscounts(),
  });
}

export function useCreateDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDiscountBody) => createDiscount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
    },
  });
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDiscountBody }) =>
      updateDiscount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
    },
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
    },
  });
}

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

export function useServiceDiscounts() {
  return useQuery({
    queryKey: [...discountKeys.list(), "service"],
    queryFn: () =>
      import("@/api/discounts").then((m) => m.getServiceDiscounts()),
  });
}

export function useCreateServiceDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data: import("@ps-design/schemas/discount").CreateServiceDiscountBody,
    ) =>
      import("@/api/discounts").then((m) => m.createServiceDiscount(data)),
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
      data: import("@ps-design/schemas/discount").UpdateServiceDiscountBody;
    }) =>
      import("@/api/discounts").then((m) =>
        m.updateServiceDiscount(id, data),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
    },
  });
}

export function useMenuDiscounts() {
  return useQuery({
    queryKey: [...discountKeys.list(), "menu"],
    queryFn: () => import("@/api/discounts").then((m) => m.getMenuDiscounts()),
  });
}

export function useCreateMenuDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data: import("@ps-design/schemas/discount").CreateMenuDiscountBody,
    ) => import("@/api/discounts").then((m) => m.createMenuDiscount(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
    },
  });
}

export function useUpdateMenuDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: import("@ps-design/schemas/discount").UpdateMenuDiscountBody;
    }) =>
      import("@/api/discounts").then((m) => m.updateMenuDiscount(id, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
    },
  });
}
