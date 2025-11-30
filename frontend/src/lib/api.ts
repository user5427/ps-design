import type { InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
    baseURL: '/api/auth',
    withCredentials: true,
})

// Add access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().getAccessToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export interface AuthUser {
    userId: string
    email: string
    role: string
    businessId: string | null
    isPasswordResetRequired: boolean
}

export interface LoginResponse extends AuthUser {
    accessToken: string
}

export const authApi = {
    login: (email: string, password: string) =>
        api.post<LoginResponse>('/login', { email, password }).then((r) => r.data),

    logout: () =>
        api.post('/logout').then(() => undefined),

    getCurrentUser: () =>
        api.get<AuthUser>('/me').then((r) => r.data),

    refreshToken: () =>
        api.post<{ accessToken: string }>('/refresh').then((r) => r.data),

    changePassword: (currentPassword: string, newPassword: string) =>
        api.post('/change-password', { currentPassword, newPassword }).then(() => undefined),
}
