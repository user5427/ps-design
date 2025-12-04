import { z } from "zod";
import { uuid } from "../../../../shared/zod-utils";

export type {
  ErrorResponse,
  SuccessResponse,
} from "../../../../shared/response-types";
export {
  errorResponseSchema,
  successResponseSchema,
} from "../../../../shared/response-types";

export const productResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  description: z.string().nullable(),
  productUnitId: uuid(),
  businessId: uuid(),
  isDisabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductResponse = z.infer<typeof productResponseSchema>;
