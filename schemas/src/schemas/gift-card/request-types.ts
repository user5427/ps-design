import { z } from "zod";
import { uuid, datetime } from "../shared/zod-utils";

const MAX_CODE_LENGTH = 50;

export const GiftCardIdParam = z.object({ giftCardId: uuid() });

export const CreateGiftCardSchema = z.object({
    code: z.string().min(1).max(MAX_CODE_LENGTH),
    value: z.number().int().min(1), // cents
    expiresAt: datetime().nullable().optional(),
});

export const UpdateGiftCardSchema = z.object({
    code: z.string().min(1).max(MAX_CODE_LENGTH).optional(),
    value: z.number().int().min(1).optional(),
    expiresAt: datetime().nullable().optional(),
});

export const ValidateGiftCardSchema = z.object({
    code: z.string().min(1).max(MAX_CODE_LENGTH),
});

export type GiftCardIdParams = z.infer<typeof GiftCardIdParam>;
export type CreateGiftCardBody = z.infer<typeof CreateGiftCardSchema>;
export type UpdateGiftCardBody = z.infer<typeof UpdateGiftCardSchema>;
export type ValidateGiftCardBody = z.infer<typeof ValidateGiftCardSchema>;
