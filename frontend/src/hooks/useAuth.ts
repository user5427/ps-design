import { useAuthStore } from './useAuthStore'

/**
 * Custom hook to access auth store
 * Usage: const { userId, isAuthenticated, login, logout } = useAuth()
 */
export function useAuth() {
    return useAuthStore()
}
