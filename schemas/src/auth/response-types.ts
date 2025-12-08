import { z } from "zod";

export const AuthUserResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  businessId: z.uuid().nullable(),
  role: z.string(),
  isPasswordResetRequired: z.boolean(),
});

export const LoginResponseSchema = AuthUserResponseSchema.extend({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
});

export type AuthUserResponse = z.infer<typeof AuthUserResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
