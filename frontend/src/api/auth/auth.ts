import { apiClient } from '@/api/client'
import { LoginRequestSchema, LoginResponseSchema, ChangePasswordRequestSchema, ChangePasswordResponseSchema, AuthUserResponseSchema } from '@/schemas/auth'
import type { LoginRequest, LoginResponse, ChangePasswordRequest, ChangePasswordResponse, AuthUserResponse } from '@/schemas/auth'

export async function login(request: LoginRequest): Promise<LoginResponse> {
    const validated = LoginRequestSchema.parse(request)
    const response = await apiClient.post<LoginResponse>('/auth/login', validated)
    return LoginResponseSchema.parse(response.data)
}

export async function logout(): Promise<void> {
    await apiClient.post('/auth/logout')
}

export async function getCurrentUser(): Promise<AuthUserResponse> {
    const response = await apiClient.get<AuthUserResponse>('/auth/me')
    return AuthUserResponseSchema.parse(response.data)
}

export async function refreshToken(): Promise<{ accessToken: string }> {
    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh')
    return response.data
}

export async function changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const validated = ChangePasswordRequestSchema.parse(request)
    const response = await apiClient.post<ChangePasswordResponse>('/auth/change-password', validated)
    return ChangePasswordResponseSchema.parse(response.data)
}
