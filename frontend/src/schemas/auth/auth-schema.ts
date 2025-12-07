// Re-export from @ps-design/schemas package
export {
  LoginSchema as LoginRequestSchema,
  ChangePasswordSchema as ChangePasswordRequestSchema,
  type LoginBody as LoginRequest,
  type ChangePasswordBody as ChangePasswordRequest,
  AuthUserResponseSchema,
  LoginResponseSchema,
  type UserResponse as AuthUserResponse,
  type LoginResponse,
  SuccessResponseSchema,
} from "@ps-design/schemas/auth";

// ChangePasswordResponse schema
import { z } from "zod";

export const ChangePasswordResponseSchema = z.object({
  success: z.boolean(),
});

export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponseSchema>;
