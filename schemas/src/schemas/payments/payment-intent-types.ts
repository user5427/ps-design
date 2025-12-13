import { z } from "zod";

export const CreatePaymentIntentSchema = z.object({
  amount: z.number().int().min(50), // cents, minimum 50 cents (0.50 EUR)
  currency: z.string().length(3).default("eur").optional(),
});

export const CreatePaymentIntentResponseSchema = z.object({
  paymentIntentId: z.string(),
  clientSecret: z.string(),
});

export type CreatePaymentIntentBody = z.infer<typeof CreatePaymentIntentSchema>;
export type CreatePaymentIntentResponse = z.infer<
  typeof CreatePaymentIntentResponseSchema
>;
