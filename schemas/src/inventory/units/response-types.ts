import { z } from "zod";
import { uuid } from "../../shared/zod-utils";

export type {
  ErrorResponse,
  SuccessResponse,
} from "../../shared/response-types";
export {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from "../../shared/response-types";

export const ProductUnitResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  symbol: z.string().nullable(),
  businessId: uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductUnitResponse = z.infer<typeof ProductUnitResponseSchema>;
