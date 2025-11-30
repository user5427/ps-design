import { z } from 'zod'

export const LoginResponseSchema = z.object({
    userId: z.string(),
    role: z.string(),
    businessId: z.string().nullable(),
    isPasswordResetRequired: z.boolean(),
})

export const ChangePasswordResponseSchema = z.object({
    success: z.boolean(),
})

export const ChangePasswordPayloadSchema = z.object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

// Type inference
export type LoginResponse = z.infer<typeof LoginResponseSchema>
export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponseSchema>
export type ChangePasswordPayload = z.infer<typeof ChangePasswordPayloadSchema>
