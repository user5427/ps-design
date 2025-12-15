import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type {
  UserResponse,
  UsersResponse,
  CreateUserBody,
  UpdateUserBody,
  AssignRolesBody,
} from "@ps-design/schemas/user";
import type { SuccessResponse } from "@ps-design/schemas/shared";

export const USERS_QUERY_KEY = ["users"];

export function useUsers(businessId?: string) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, businessId],
    queryFn: async () => {
      const params = businessId ? { businessId } : {};
      const response = await apiClient.get<UsersResponse>("/users", {
        params,
      });
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
  });
}

export function useUserById(userId: string) {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, userId],
    queryFn: async () => {
      const response = await apiClient.get<UserResponse>(`/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserBody) => {
      const response = await apiClient.post<UserResponse>("/users", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEY,
      });
    },
  });
}

export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserBody) => {
      const response = await apiClient.put<UserResponse>(
        `/users/${userId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEY,
      });
    },
  });
}

export function useAssignRoles(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignRolesBody) => {
      const response = await apiClient.post<UserResponse>(
        `/users/${userId}/roles`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: ["auth", "me"],
      });
      queryClient.invalidateQueries({
        queryKey: ["scopes"],
      });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      roleId,
    }: {
      userId: string;
      roleId: string;
    }) => {
      await apiClient.delete<SuccessResponse>(
        `/users/${userId}/roles/${roleId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: ["auth", "me"],
      });
      queryClient.invalidateQueries({
        queryKey: ["scopes"],
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete<SuccessResponse>(`/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: USERS_QUERY_KEY,
      });
    },
  });
}
