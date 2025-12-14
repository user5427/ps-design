import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllTaxes,
  createTax,
  updateTax,
  deleteTax,
} from "@/api/tax";
import type {
  CreateTaxBody,
  UpdateTaxBody,
} from "@ps-design/schemas/tax";
import { categoryKeys } from "@/hooks/category-hooks";

export const taxKeys = {
  all: [ "taxes" ] as const,
  list: () => [ ...taxKeys.all ] as const,
  detail: (id: string) => [ ...taxKeys.all, id ] as const,
};

export function useTaxes() {
  return useQuery({
    queryKey: taxKeys.list(),
    queryFn: () => getAllTaxes(),
  });
}

export function useCreateTax() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaxBody) => createTax(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxKeys.all });
    },
  });
}

export function useUpdateTax() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaxBody }) =>
      updateTax(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxKeys.all });
    },
  });
}

export function useDeleteTax() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTax(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
