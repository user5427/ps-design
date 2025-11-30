import type { InternalAxiosRequestConfig, AxiosError } from 'axios'
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

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false
let failedQueue: Array<{
    resolve: (token: string | null) => void
    reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error)
        } else {
            resolve(token)
        }
    })
    failedQueue = []
}

// Handle 401 responses by refreshing token and retrying
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        if (
            error.response?.status !== 401 ||
            originalRequest._retry ||
            originalRequest.url === '/refresh' ||
            originalRequest.url === '/login'
        ) {
            return Promise.reject(error)
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject })
            }).then((token) => {
                if (token) {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                }
                return api(originalRequest)
            })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
            const { accessToken } = await api.post<{ accessToken: string }>('/refresh').then(r => r.data)
            useAuthStore.getState().setAccessToken(accessToken)
            processQueue(null, accessToken)
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return api(originalRequest)
        } catch (refreshError) {
            processQueue(refreshError, null)
            useAuthStore.getState().setAccessToken(null)
            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false
        }
    }
)

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
