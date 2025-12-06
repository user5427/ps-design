import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  isInitialized: boolean;

  setAccessToken: (token: string | null) => void;
  getAccessToken: () => string | null;
  getAuthHeaders: () => HeadersInit;
  setInitialized: (initialized: boolean) => void;
  isAuthInitialized: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  isInitialized: false,

  setAccessToken: (token: string | null) => set({ accessToken: token }),

  getAccessToken: () => get().accessToken,

  getAuthHeaders: (): HeadersInit => {
    const token = get().accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  setInitialized: (initialized: boolean) => set({ isInitialized: initialized }),

  isAuthInitialized: () => get().isInitialized,
}));
