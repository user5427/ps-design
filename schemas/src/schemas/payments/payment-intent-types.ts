import { z } from "zod";
import { uuid } from "../shared";

export const InitiatePaymentSchema = z.object({
  appointmentId: uuid(),
  tipAmount: z.number().int().min(0).optional(), // cents
  giftCardCode: z.string().max(50).optional(),
});

export const MINIMUM_STRIPE_PAYMENT_AMOUNT = 50;
export const InitiatePaymentResponseSchema = z.object({
  clientSecret: z.string(),
  paymentIntentId: z.string(),
  finalAmount: z.number().int().min(MINIMUM_STRIPE_PAYMENT_AMOUNT), // cents
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
