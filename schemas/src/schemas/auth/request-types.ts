import { z } from "zod";

const MIN_PASSWORD_LENGTH = 8;
const MIN_PASSWORD_MESSAGE = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;

export const LoginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(MIN_PASSWORD_LENGTH, MIN_PASSWORD_MESSAGE),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(MIN_PASSWORD_LENGTH, MIN_PASSWORD_MESSAGE),
  newPassword: z.string().min(MIN_PASSWORD_LENGTH, MIN_PASSWORD_MESSAGE),
});

export const ImpersonateBusinessSchema = z.object({
  businessId: z.uuid("Invalid business ID format"),
});

export type LoginBody = z.infer<typeof LoginSchema>;
export type ChangePasswordBody = z.infer<typeof ChangePasswordSchema>;
export type ImpersonateBusinessBody = z.infer<typeof ImpersonateBusinessSchema>;
