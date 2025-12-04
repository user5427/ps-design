import { z } from "zod";

export const successResponseSchema = z.object({
  success: z.boolean(),
});

export const errorResponseSchema = z.object({
  message: z.string(),
});

export type SuccessResponse = z.infer<typeof successResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
