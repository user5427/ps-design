import { authorizedRequest } from '../client'
import {
    LoginResponseSchema,
    ChangePasswordResponseSchema,
    type LoginResponse,
    type ChangePasswordResponse,
    type ChangePasswordPayload,
} from '../types/auth'

/**
 * Login endpoint
 * POST /auth/login
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
    const response = await authorizedRequest<LoginResponse>(email, password, {
        method: 'POST',
        url: '/auth/login',
    })
    return LoginResponseSchema.parse(response.data)
}

/**
 * Change password endpoint
 * POST /auth/change-password
 */
export async function changePassword(
    email: string,
    currentPassword: string,
    newPassword: string
): Promise<ChangePasswordResponse> {
    const response = await authorizedRequest<ChangePasswordResponse>(
        email,
        currentPassword,
        {
            method: 'POST',
            url: '/auth/change-password',
            data: { newPassword } as ChangePasswordPayload,
        }
    )
    return ChangePasswordResponseSchema.parse(response.data)
}
