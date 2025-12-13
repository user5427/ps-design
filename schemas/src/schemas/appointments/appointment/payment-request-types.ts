import { z } from "zod";

export const PaymentMethodEnum = z.enum(["CASH", "GIFTCARD", "STRIPE"]);

export const PayAppointmentSchema = z.object({
  paymentMethod: PaymentMethodEnum,
  tipAmount: z.number().int().min(0).optional(), // cents
});

export const RefundAppointmentSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
export type PayAppointmentBody = z.infer<typeof PayAppointmentSchema>;
export type RefundAppointmentBody = z.infer<typeof RefundAppointmentSchema>;
