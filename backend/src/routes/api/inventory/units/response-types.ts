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

export const productUnitResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  symbol: z.string().nullable(),
  businessId: uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductUnitResponse = z.infer<typeof productUnitResponseSchema>;
