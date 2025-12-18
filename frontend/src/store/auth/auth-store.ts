import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  isInitialized: boolean;
  originalAccessToken: string | null;
  isImpersonating: boolean;

  setAccessToken: (token: string | null) => void;
  getAccessToken: () => string | null;
  getAuthHeaders: () => HeadersInit;
  setInitialized: (initialized: boolean) => void;
  isAuthInitialized: () => boolean;
  startImpersonation: (newToken: string) => void;
  endImpersonation: () => void;
  getIsImpersonating: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      isInitialized: false,
      originalAccessToken: null,
      isImpersonating: false,

      setAccessToken: (token: string | null) => set({ accessToken: token }),

      getAccessToken: () => get().accessToken,

      getAuthHeaders: (): HeadersInit => {
        const token = get().accessToken;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },

      setInitialized: (initialized: boolean) =>
        set({ isInitialized: initialized }),

      isAuthInitialized: () => get().isInitialized,

      startImpersonation: (newToken: string) =>
        set({
          originalAccessToken: get().accessToken,
          accessToken: newToken,
          isImpersonating: true,
        }),

      endImpersonation: () =>
        set({
          accessToken: get().originalAccessToken,
          originalAccessToken: null,
          isImpersonating: false,
        }),

      getIsImpersonating: () => get().isImpersonating,
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        originalAccessToken: state.originalAccessToken,
        isImpersonating: state.isImpersonating,
      }),
    },
  ),
);
