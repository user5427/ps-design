import { apiClient } from "@/api/client";
import type {
  AuthUserResponse,
  LoginBody,
  LoginResponse,
  ChangePasswordBody,
  SuccessResponse,
} from "@ps-design/schemas/auth";
import {
  AuthUserResponseSchema,
  ChangePasswordSchema,
  LoginSchema,
  LoginResponseSchema,
  SuccessResponseSchema,
} from "@ps-design/schemas/auth";

export async function login(request: LoginBody): Promise<LoginResponse> {
  const validated = LoginSchema.parse(request);
  const response = await apiClient.post<LoginResponse>(
    "/auth/login",
    validated,
  );
  return LoginResponseSchema.parse(response.data);
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function getCurrentUser(): Promise<AuthUserResponse> {
  const response = await apiClient.get<AuthUserResponse>("/auth/me");
  return AuthUserResponseSchema.parse(response.data);
}

export async function refreshToken(): Promise<{ accessToken: string }> {
  const response = await apiClient.post<{ accessToken: string }>(
    "/auth/refresh",
  );
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
