import { z } from "zod";
import { uuid, datetime } from "../shared/zod-utils";

const MIN_CODE_LENGTH = 3;
const MAX_CODE_LENGTH = 50;

const MIN_CODE_MESSAGE = `Gift card code must be at least ${MIN_CODE_LENGTH} characters`;
const MAX_CODE_MESSAGE = `Gift card code must be at most ${MAX_CODE_LENGTH} characters`;

const futureDateTime = () =>
  datetime().refine(
    (date) => new Date(date) > new Date(),
    "Expiration date must be in the future",
  );

export const GiftCardIdParam = z.object({ giftCardId: uuid() });

export const CreateGiftCardSchema = z.object({
  code: z
    .string()
    .min(MIN_CODE_LENGTH, MIN_CODE_MESSAGE)
    .max(MAX_CODE_LENGTH, MAX_CODE_MESSAGE),
  value: z.number().int().min(1), // cents
  expiresAt: futureDateTime().nullable().optional(),
});

export const UpdateGiftCardSchema = z.object({
  code: z
    .string()
    .min(MIN_CODE_LENGTH, MIN_CODE_MESSAGE)
    .max(MAX_CODE_LENGTH, MAX_CODE_MESSAGE)
    .optional(),
  value: z.number().int().min(1).optional(),
  expiresAt: futureDateTime().nullable().optional(),
});

export const ValidateGiftCardSchema = z.object({
  code: z
    .string()
    .min(MIN_CODE_LENGTH, MIN_CODE_MESSAGE)
    .max(MAX_CODE_LENGTH, MAX_CODE_MESSAGE),
});

export type GiftCardIdParams = z.infer<typeof GiftCardIdParam>;
export type CreateGiftCardBody = z.infer<typeof CreateGiftCardSchema>;
export type UpdateGiftCardBody = z.infer<typeof UpdateGiftCardSchema>;
export type ValidateGiftCardBody = z.infer<typeof ValidateGiftCardSchema>;
