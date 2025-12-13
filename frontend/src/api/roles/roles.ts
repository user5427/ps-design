import { apiClient } from "@/api/client";

export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  businessId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleBody {
  name: string;
  description?: string;
  scopeIds: string[];
  businessId?: string;
}

export interface UpdateRoleBody {
  name?: string;
  description?: string;
  scopeIds?: string[];
}

export interface ScopeResponse {
  id: string;
  name: string;
  description: string | null;
}

export async function getRoles(businessId?: string) {
  const response = await apiClient.get<RoleResponse[]>("/roles", {
    params: { businessId },
  });
  return response.data;
}

export async function getRoleById(roleId: string) {
  const response = await apiClient.get<RoleResponse>(`/roles/${roleId}`);
  return response.data;
}

export async function createRole(data: CreateRoleBody) {
  const response = await apiClient.post<RoleResponse>("/roles", data);
  return response.data;
}

export async function updateRole(roleId: string, data: UpdateRoleBody) {
  const response = await apiClient.put<RoleResponse>(`/roles/${roleId}`, data);
  return response.data;
}

export async function deleteRole(roleId: string) {
  await apiClient.delete(`/roles/${roleId}`);
}

export async function getAvailableScopes() {
  const response = await apiClient.get<ScopeResponse[]>("/scopes");
  return response.data;
}

export async function getUserScopes() {
  const response = await apiClient.get<string[]>("/users/me/scopes");
  return response.data;
}
