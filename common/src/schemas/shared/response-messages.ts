import { z } from "zod";

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
});

export const ErrorResponseSchema = z.object({
  message: z.string(),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
