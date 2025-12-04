import { create } from 'zustand'

interface AuthState {
    accessToken: string | null

    setAccessToken: (token: string | null) => void
    getAccessToken: () => string | null
    getAuthHeaders: () => HeadersInit
}

export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,

    setAccessToken: (token: string | null) => set({ accessToken: token }),

    getAccessToken: () => get().accessToken,

    getAuthHeaders: (): HeadersInit => {
        const token = get().accessToken
        return token ? { 'Authorization': `Bearer ${token}` } : {}
    },
}))