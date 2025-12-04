import { z } from "zod";

const MIN_PASSWORD_LENGTH = 8;
const MIN_PASSWORD_MESSAGE = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;

export const loginSchema = z.object({
    email: z.email("Invalid email format"),
    password: z.string().min(MIN_PASSWORD_LENGTH, MIN_PASSWORD_MESSAGE),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(MIN_PASSWORD_LENGTH, MIN_PASSWORD_MESSAGE),
    newPassword: z.string().min(MIN_PASSWORD_LENGTH, MIN_PASSWORD_MESSAGE),
});

export type LoginBody = z.infer<typeof loginSchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
