import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type {
  RoleResponse,
  RolesResponse,
  CreateRoleBody,
  UpdateRoleBody,
  AssignScopesBody,
} from "@ps-design/schemas/role";
import type { SuccessResponse } from "@ps-design/schemas/shared";

export const ROLES_QUERY_KEY = ["roles"];

export function useRoles(businessId?: string) {
  return useQuery({
    queryKey: [...ROLES_QUERY_KEY, businessId],
    queryFn: async () => {
      const params = businessId ? { businessId } : {};
      const response = await apiClient.get<RolesResponse>("/roles", {
        params,
      });
      return response.data;
    },
    enabled: !!businessId,
  });
}

export function useRoleById(roleId: string) {
  return useQuery({
    queryKey: [...ROLES_QUERY_KEY, roleId],
    queryFn: async () => {
      const response = await apiClient.get<RoleResponse>(`/roles/${roleId}`);
      return response.data;
    },
    enabled: !!roleId,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoleBody) => {
      const response = await apiClient.post<RoleResponse>("/roles", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ROLES_QUERY_KEY,
      });
    },
  });
}

export function useUpdateRole(roleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateRoleBody) => {
      const response = await apiClient.patch<RoleResponse>(
        `/roles/${roleId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ROLES_QUERY_KEY,
      });
    },
  });
}

export function useAssignScopes(roleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignScopesBody) => {
      const response = await apiClient.post<RoleResponse>(
        `/roles/${roleId}/scopes`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ROLES_QUERY_KEY,
      });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      await apiClient.delete<SuccessResponse>(`/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ROLES_QUERY_KEY,
      });
    },
  });
}
