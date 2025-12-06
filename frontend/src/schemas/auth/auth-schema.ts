import { z } from 'zod'

export const LoginRequestSchema = z.object({
    email: z.email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const AuthUserResponseSchema = z.object({
    id: z.uuid(),
    email: z.email(),
    role: z.string(),
    businessId: z.uuid().nullable(),
    isPasswordResetRequired: z.boolean(),
})

export const LoginResponseSchema = AuthUserResponseSchema.extend({
    accessToken: z.string(),
})

export const ChangePasswordRequestSchema = z.object({
    currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export const ChangePasswordResponseSchema = z.object({
    success: z.boolean(),
})

export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type LoginResponse = z.infer<typeof LoginResponseSchema>
export type AuthUserResponse = z.infer<typeof AuthUserResponseSchema>
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>
export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponseSchema>