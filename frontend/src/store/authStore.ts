import { create } from 'zustand'
import type { AuthUser } from '../lib/api'

interface AuthState {
    user: AuthUser | null
    accessToken: string | null
    isLoading: boolean
    error: string | null

    setAccessToken: (token: string | null) => void
    getAccessToken: () => string | null
    getAuthHeaders: () => HeadersInit

    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    fetchCurrentUser: () => Promise<void>
    refreshToken: () => Promise<void>
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>
    clearError: () => void
    initializeAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    isLoading: false,
    error: null,

    setAccessToken: (token: string | null) => {
        set({ accessToken: token })
    },

    getAccessToken: () => {
        return get().accessToken
    },

    getAuthHeaders: () => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        }
        const token = get().accessToken
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
        return headers
    },

    login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            })

            if (!res.ok) {
                const error = await res.json().catch(() => ({ error: 'Login failed' }))
                throw new Error(error.error || 'Login failed')
            }

            const data = await res.json()
            set({
                user: data,
                accessToken: data.accessToken,
                isLoading: false
            })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    logout: async () => {
        set({ isLoading: true, error: null })
        try {
            const headers = get().getAuthHeaders()
            const res = await fetch('/api/auth/logout', {
                method: 'POST',
                headers,
                credentials: 'include',
            })

            set({ user: null, accessToken: null, isLoading: false })

            if (!res.ok) {
                throw new Error('Logout failed')
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    fetchCurrentUser: async () => {
        set({ isLoading: true, error: null })
        try {
            const headers = get().getAuthHeaders()
            const res = await fetch('/api/auth/me', {
                headers,
                credentials: 'include',
            })

            if (!res.ok) {
                throw new Error('Failed to get current user')
            }

            const user = await res.json()
            set({ user, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false, user: null })
            throw error
        }
    },

    refreshToken: async () => {
        try {
            const res = await fetch('/api/auth/refresh', {
                method: 'POST',
                credentials: 'include',
            })

            if (!res.ok) {
                set({ accessToken: null })
                throw new Error('Token refresh failed')
            }

            const data = await res.json()
            set({ accessToken: data.accessToken })

            const userRes = await fetch('/api/auth/me', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${data.accessToken}`,
                },
                credentials: 'include',
            })

            if (!userRes.ok) {
                throw new Error('Failed to fetch user after refresh')
            }

            const user = await userRes.json()
            set({ user })
        } catch (error: any) {
            set({ error: error.message, user: null })
            throw error
        }
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true, error: null })
        try {
            const headers = get().getAuthHeaders()
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ currentPassword, newPassword }),
            })

            if (!res.ok) {
                const error = await res.json().catch(() => ({ error: 'Password change failed' }))
                throw new Error(error.error || 'Password change failed')
            }

            const userRes = await fetch('/api/auth/me', {
                headers,
                credentials: 'include',
            })

            const user = await userRes.json()
            set({ user, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    clearError: () => set({ error: null }),

    initializeAuth: async () => {
        const token = get().accessToken
        if (token) {
            try {
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
                const res = await fetch('/api/auth/me', {
                    headers,
                    credentials: 'include',
                })

                if (!res.ok) {
                    set({ user: null, accessToken: null })
                    return
                }

                const user = await res.json()
                set({ user })
            } catch (error) {
                // Token is invalid, clear it
                set({ user: null, accessToken: null })
            }
        }
    },
}))