import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type {
  BusinessResponse,
  CreateBusinessBody,
  PaginatedBusinessResponse,
  UpdateBusinessBody,
} from "@ps-design/schemas/business";

export const BUSINESSES_QUERY_KEY = ["businesses"];

export function useBusinessesPaginated(page: number, limit: number, search?: string) {
  return useQuery({
    queryKey: [...BUSINESSES_QUERY_KEY, page, limit, search],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedBusinessResponse>(
        "/businesses",
        {
          params: { page, limit, search },
        },
      );
      return response.data;
    },
  });
}

export function useBusinessById(businessId: string) {
  return useQuery({
    queryKey: [...BUSINESSES_QUERY_KEY, businessId],
    queryFn: async () => {
      const response = await apiClient.get<BusinessResponse>(
        `/businesses/${businessId}`,
      );
      return response.data;
    },
  });
}

export function useCreateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBusinessBody) => {
      const response = await apiClient.post<BusinessResponse>(
        "/businesses",
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BUSINESSES_QUERY_KEY,
      });
    },
  });
}

export function useUpdateBusiness(businessId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBusinessBody) => {
      const response = await apiClient.put<BusinessResponse>(
        `/businesses/${businessId}`,
        data,
      );
      return response.data;
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
    mutationFn: async (businessId: string) => {
      await apiClient.delete(`/businesses/${businessId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: BUSINESSES_QUERY_KEY,
      });
    },
  });
}
