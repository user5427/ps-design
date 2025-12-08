import { z } from "zod";

export const LoginResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  businessId: z.uuid().nullable(),
  role: z.string(),
  isPasswordResetRequired: z.boolean(),
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
