import { z } from "zod";

export { successResponseSchema, errorResponseSchema } from "../../../shared/response-types";
export type { SuccessResponse, ErrorResponse } from "../../../shared/response-types";

export const userResponseSchema = z.object({
    id: z.uuid(),
    email: z.email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.string(),
    isPasswordResetRequired: z.boolean(),
});

export const loginResponseSchema = userResponseSchema.extend({
    accessToken: z.string(),
});

export const refreshResponseSchema = z.object({
    accessToken: z.string(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;
