import { useMutation, useQuery } from "@tanstack/react-query";
import {
  login,
  logout,
  getCurrentUser,
  refreshToken,
  changePassword,
} from "@/api/auth";
import type {
  LoginBody,
  UserResponse,
  ChangePasswordBody,
  AuthResponse,
  RefreshResponse,
} from "@ps-design/schemas/auth";
import type { SuccessResponse } from "@ps-design/schemas/shared/response-types";

export function useLogin() {
  return useMutation<AuthResponse, Error, LoginBody>({
    mutationFn: async (request) => {
      return login(request);
    },
  });
}

export function useLogout() {
  return useMutation<SuccessResponse, Error>({
    mutationFn: async () => {
      return logout();
    },
  });
}

export function useGetCurrentUser() {
  return useQuery<UserResponse, Error>({
    queryKey: ["currentUser"],
    queryFn: async () => {
      return getCurrentUser();
    },
  });
}

export function useRefreshToken() {
  return useMutation<RefreshResponse, Error>({
    mutationFn: async () => {
      return refreshToken();
    },
  });
}

export function useChangePassword() {
  return useMutation<SuccessResponse, Error, ChangePasswordBody>({
    mutationFn: async (request) => {
      return changePassword(request);
    },
  });
}
