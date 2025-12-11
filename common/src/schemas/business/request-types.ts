import { z } from "zod";
import { uuid } from "../shared/zod-utils";
import { BUSINESS_CONSTRAINTS } from "../../constants/business";

export const BusinessIdParam = z.object({ businessId: uuid() });

export const CreateBusinessSchema = z.object({
  name: z
    .string()
    .min(
      BUSINESS_CONSTRAINTS.NAME.MIN_LENGTH,
      BUSINESS_CONSTRAINTS.NAME.MIN_LENGTH_MESSAGE
    )
    .max(
      BUSINESS_CONSTRAINTS.NAME.MAX_LENGTH,
      BUSINESS_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE
    ),
});

export const UpdateBusinessSchema = z.object({
  name: z
    .string()
    .min(
      BUSINESS_CONSTRAINTS.NAME.MIN_LENGTH,
      BUSINESS_CONSTRAINTS.NAME.MIN_LENGTH_MESSAGE
    )
    .max(
      BUSINESS_CONSTRAINTS.NAME.MAX_LENGTH,
      BUSINESS_CONSTRAINTS.NAME.MAX_LENGTH_MESSAGE
    )
    .optional(),
});

export type CreateBusinessBody = z.infer<typeof CreateBusinessSchema>;
export type UpdateBusinessBody = z.infer<typeof UpdateBusinessSchema>;
export type BusinessIdParams = z.infer<typeof BusinessIdParam>;
