import { z } from "zod";
import { uuid } from "../shared";

export const InitiatePaymentSchema = z.object({
  appointmentId: uuid(),
  tipAmount: z.number().int().min(0).optional(), // cents
  giftCardCode: z.string().max(50).optional(),
});

export const InitiatePaymentResponseSchema = z.object({
  clientSecret: z.string(),
  paymentIntentId: z.string(),
  finalAmount: z.number().int(), // cents - the server-calculated amount
  breakdown: z.object({
    servicePrice: z.number().int(),
    tipAmount: z.number().int(),
    giftCardDiscount: z.number().int(),
  }),
});

export type InitiatePaymentBody = z.infer<typeof InitiatePaymentSchema>;
export type InitiatePaymentResponse = z.infer<
  typeof InitiatePaymentResponseSchema
>;
