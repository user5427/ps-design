import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth'

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_PROTOCOL}://${import.meta.env.VITE_BACKEND_HOST}:${import.meta.env.VITE_BACKEND_PORT}/api`

let routerInstance: any = null

export function setRouterInstance(router: any) {
    routerInstance = router
}

export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
})

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
    refreshSubscribers.forEach((callback) => callback(token))
    refreshSubscribers = []
}

function addRefreshSubscriber(callback: (token: string) => void) {
    refreshSubscribers.push(callback)
}

// Add request interceptor to add access token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().getAccessToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Add response interceptor for token refresh on 401
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: any) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    addRefreshSubscriber((token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`
                        resolve(apiClient(originalRequest))
                    })
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
                    withCredentials: true,
                })

                const { accessToken } = response.data
                useAuthStore.getState().setAccessToken(accessToken)
                originalRequest.headers.Authorization = `Bearer ${accessToken}`
                isRefreshing = false
                onRefreshed(accessToken)
                return apiClient(originalRequest)
            } catch (refreshError) {
                isRefreshing = false
                useAuthStore.getState().setAccessToken(null)

                // Only redirect to login if we're not already on the login page
                if (routerInstance && routerInstance.state.location.pathname !== '/auth/login') {
                    routerInstance.navigate({ to: '/auth/login' })
                }

                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default apiClient
