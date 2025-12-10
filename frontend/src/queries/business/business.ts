import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBusinessesPaginated,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
} from "@/api/business";
import type {
  CreateBusinessBody,
  UpdateBusinessBody,
} from "@ps-design/schemas/business";

export const BUSINESSES_QUERY_KEY = ["business"];

export function useBusinessesPaginated(
  page: number,
  limit: number,
  search?: string,
) {
  return useQuery({
    queryKey: [...BUSINESSES_QUERY_KEY, page, limit, search],
    queryFn: async () => {
      return getBusinessesPaginated(page, limit, search);
    },
  });
}

export function useBusinessById(businessId: string) {
  return useQuery({
    queryKey: [...BUSINESSES_QUERY_KEY, businessId],
    queryFn: async () => {
      return getBusinessById(businessId);
    },
  });
}

export function useCreateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBusinessBody) => {
      return createBusiness(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BUSINESSES_QUERY_KEY,
      });
    },
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBusinessBody & { id: string }) => {
      return updateBusiness(data.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BUSINESSES_QUERY_KEY,
      });
    },
  });
}

export function useDeleteBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteBusiness(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BUSINESSES_QUERY_KEY,
      });
    },
  });
}
