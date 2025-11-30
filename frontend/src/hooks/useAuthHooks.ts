import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../lib/api'

export const authKeys = {
    all: ['auth'] as const,
    me: () => [...authKeys.all, 'me'] as const,
}

export function useAuthUser() {
    const store = useAuthStore()
    const token = store.getAccessToken()

    return useQuery({
        queryKey: authKeys.me(),
        queryFn: async () => {
            if (!token) throw new Error('No token')
            return authApi.getCurrentUser(token)
        },
        enabled: !!token, // Only run query if we have a token
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export function useLogin() {
    const queryClient = useQueryClient()
    const store = useAuthStore()

    return useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) => {
            return authApi.login(email, password)
        },
        onSuccess: (data) => {
            store.setAccessToken(data.accessToken)
            // Invalidate auth query to refetch user
            queryClient.invalidateQueries({ queryKey: authKeys.me() })
        },
    })
}

export function useLogout() {
    const queryClient = useQueryClient()
    const store = useAuthStore()

    return useMutation({
        mutationFn: async () => {
            return authApi.logout()
        },
        onSuccess: () => {
            store.setAccessToken(null)
            // Clear all auth queries
            queryClient.removeQueries({ queryKey: authKeys.all })
        },
    })
}


export function useRefreshToken() {
    const queryClient = useQueryClient()
    const store = useAuthStore()

    return useMutation({
        mutationFn: async () => {
            return authApi.refreshToken()
        },
        onSuccess: (data) => {
            store.setAccessToken(data.accessToken)
            queryClient.invalidateQueries({ queryKey: authKeys.me() })
        },
    })
}

/**
 * Hook to change password
 */
export function useChangePassword() {
    const queryClient = useQueryClient()
    const store = useAuthStore()

    return useMutation({
        mutationFn: async ({
            currentPassword,
            newPassword,
        }: {
            currentPassword: string
            newPassword: string
        }) => {
            const token = store.getAccessToken()
            if (!token) throw new Error('No token')
            return authApi.changePassword(token, currentPassword, newPassword)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: authKeys.me() })
        },
    })
}
