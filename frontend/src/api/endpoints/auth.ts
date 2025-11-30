import { authorizedRequest } from '@/api/client'
import {
    LoginRequestSchema,
    LoginResponseSchema,
    ChangePasswordRequestSchema,
    ChangePasswordResponseSchema,
    type LoginRequest,
    type ChangePasswordRequest,
    type LoginResponse,
    type ChangePasswordResponse,
} from '@/api/types'

/**
 * Login endpoint
 * POST /auth/login
 */
export async function login(request: LoginRequest): Promise<LoginResponse> {
    const validated = LoginRequestSchema.parse(request)
    const response = await authorizedRequest<LoginResponse>(validated.email, validated.password, {
        method: 'POST',
        url: '/auth/login',
    })
    return LoginResponseSchema.parse(response.data)
}

/**
 * Change password endpoint
 * POST /auth/change-password
 */
export async function changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const validated = ChangePasswordRequestSchema.parse(request)
    const response = await authorizedRequest<ChangePasswordResponse>(
        validated.email,
        validated.currentPassword,
        {
            method: 'POST',
            url: '/auth/change-password',
            data: { newPassword: validated.newPassword },
        }
    )
    return ChangePasswordResponseSchema.parse(response.data)
}
