import { z } from "zod";
import { uuid, datetime } from "../shared/zod-utils";

export const GiftCardResponseSchema = z.object({
  id: uuid(),
  code: z.string(),
  value: z.number(), // cents
  expiresAt: datetime().nullable(),
  redeemedAt: datetime().nullable(),
  createdAt: datetime(),
  updatedAt: datetime(),
});

export type GiftCardResponse = z.infer<typeof GiftCardResponseSchema>;
