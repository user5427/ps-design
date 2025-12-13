import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAvailableScopes,
  getUserScopes,
  type CreateRoleBody,
  type UpdateRoleBody,
} from "@/api/roles";

export const rolesKeys = {
  all: ["roles"] as const,
  list: (businessId?: string) => [...rolesKeys.all, "list", businessId] as const,
  detail: (id: string) => [...rolesKeys.all, "detail", id] as const,
  scopes: () => [...rolesKeys.all, "scopes"] as const,
  userScopes: () => [...rolesKeys.all, "userScopes"] as const,
};

export function useRoles(businessId?: string) {
  return useQuery({
    queryKey: rolesKeys.list(businessId),
    queryFn: () => getRoles(businessId),
  });
}

export function useRoleById(roleId: string) {
  return useQuery({
    queryKey: rolesKeys.detail(roleId),
    queryFn: () => getRoleById(roleId),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleBody) => createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
}

export function useUpdateRole(roleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRoleBody) => updateRole(roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
    },
  });
}

export function useAvailableScopes() {
  return useQuery({
    queryKey: rolesKeys.scopes(),
    queryFn: getAvailableScopes,
  });
}

export function useUserScopes() {
  return useQuery({
    queryKey: rolesKeys.userScopes(),
    queryFn: getUserScopes,
  });
}
