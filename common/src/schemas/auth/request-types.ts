import { z } from "zod";
import { AUTH_CONSTRAINTS } from "../../constants/auth";

export const LoginSchema = z.object({
  email: z.email(AUTH_CONSTRAINTS.EMAIL.INVALID_FORMAT_MESSAGE),
  password: z
    .string()
    .min(
      AUTH_CONSTRAINTS.PASSWORD.MIN_LENGTH,
      AUTH_CONSTRAINTS.PASSWORD.MIN_LENGTH_MESSAGE
    ),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(
      AUTH_CONSTRAINTS.PASSWORD.MIN_LENGTH,
      AUTH_CONSTRAINTS.PASSWORD.MIN_LENGTH_MESSAGE
    ),
  newPassword: z
    .string()
    .min(
      AUTH_CONSTRAINTS.PASSWORD.MIN_LENGTH,
      AUTH_CONSTRAINTS.PASSWORD.MIN_LENGTH_MESSAGE
    ),
});

export type LoginBody = z.infer<typeof LoginSchema>;
export type ChangePasswordBody = z.infer<typeof ChangePasswordSchema>;
