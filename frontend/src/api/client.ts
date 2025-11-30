import axios, { type AxiosInstance, type AxiosResponse, type AxiosRequestConfig } from 'axios'
import { AuthStore } from '@/hooks/auth-store'

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_PROTOCOL}://${import.meta.env.VITE_BACKEND_HOST}:${import.meta.env.VITE_BACKEND_PORT}/api`

export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add response interceptor for error handling
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: any) => {
        if (error.response?.status === 401) {
            // Handle unauthorized - logout and redirect to login
            const authStore = AuthStore.getState()
            authStore.logout()
            console.error('Unauthorized - logged out')
        }
        return Promise.reject(error)
    }
)

/**
 * Public request - no auth required
 */
export async function publicRequest<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return apiClient.request(config)
}

/**
 * Authorized request - automatically adds Basic Auth header
 * Uses email and password from auth store (should be set during login)
 */
export async function authorizedRequest<T = any>(
    email: string,
    password: string,
    config: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
    const authHeader = encodeBasicAuth(email, password)
    return apiClient.request({
        ...config,
        headers: {
            ...config.headers,
            Authorization: authHeader,
        },
    })
}

/**
 * Encodes credentials to Basic Auth header
 */
function encodeBasicAuth(email: string, password: string): string {
    return 'Basic ' + btoa(`${email}:${password}`)
}

export default apiClient
