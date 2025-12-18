import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changePassword,
  getCurrentUser,
  login,
  logout,
  impersonateBusiness,
  endImpersonation,
} from "@/api/auth";
import { useAuthStore } from "@/store/auth";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export function useAuthUser() {
  const store = useAuthStore();

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => getCurrentUser(),
    enabled: !!store.getAccessToken(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const store = useAuthStore();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => login({ email, password }),
    onSuccess: (data) => {
      store.endImpersonation();
      store.setAccessToken(data.accessToken);
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const store = useAuthStore();

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      store.setAccessToken(null);
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
    onError: () => {
      store.setAccessToken(null);
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useImpersonateBusiness() {
  const queryClient = useQueryClient();
  const store = useAuthStore();

  return useMutation({
    mutationFn: async (businessId: string) => impersonateBusiness(businessId),
    onSuccess: (data) => {
      store.startImpersonation(data.accessToken);
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useEndImpersonation() {
  const queryClient = useQueryClient();
  const store = useAuthStore();

  return useMutation({
    mutationFn: () => endImpersonation(),
    onSuccess: () => {
      store.endImpersonation();
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}
