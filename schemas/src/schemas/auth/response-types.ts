import { z } from "zod";

export const UserResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  businessId: z.uuid().nullable(),
  roleIds: z.array(z.uuid()),
  isPasswordResetRequired: z.boolean(),
});

export const AuthResponseSchema = UserResponseSchema.extend({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
