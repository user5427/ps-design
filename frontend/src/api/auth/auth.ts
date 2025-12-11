import { apiClient } from "@/api/client";
import type {
  AuthResponse,
  LoginBody,
  UserResponse,
  ChangePasswordBody,
  RefreshResponse,
} from "@ps-design/schemas/auth";
import {
  AuthResponseSchema,
  ChangePasswordSchema,
  LoginSchema,
  UserResponseSchema,
} from "@ps-design/schemas/auth";
import { SuccessResponseSchema } from "@ps-design/schemas/shared";
import type { SuccessResponse } from "@ps-design/schemas/shared";

export async function login(request: LoginBody): Promise<AuthResponse> {
  const validated = LoginSchema.parse(request);
  const response = await apiClient.post<AuthResponse>("/auth/login", validated);
  return AuthResponseSchema.parse(response.data);
}

export async function logout(): Promise<SuccessResponse> {
  const response = await apiClient.post<SuccessResponse>("/auth/logout");
  return SuccessResponseSchema.parse(response.data);
}

export async function getCurrentUser(): Promise<UserResponse> {
  const response = await apiClient.get<UserResponse>("/auth/me");
  return UserResponseSchema.parse(response.data);
}

export async function refreshToken(): Promise<RefreshResponse> {
  const response = await apiClient.post<RefreshResponse>("/auth/refresh");
  return response.data;
}

export async function changePassword(
  request: ChangePasswordBody,
): Promise<SuccessResponse> {
  const validated = ChangePasswordSchema.parse(request);
  const response = await apiClient.post<SuccessResponse>(
    "/auth/change-password",
    validated,
  );
  return SuccessResponseSchema.parse(response.data);
}
