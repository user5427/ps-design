import { z } from "zod";
import { datetime, uuid } from "../../../../shared/zod-utils";

export type {
  ErrorResponse,
  SuccessResponse,
} from "../../../../shared/response-types";
export {
  errorResponseSchema,
  successResponseSchema,
} from "../../../../shared/response-types";

export const stockLevelResponseSchema = z.object({
  productId: uuid(),
  productName: z.string(),
  productUnit: z.object({
    id: uuid(),
    name: z.string(),
    symbol: z.string().nullable(),
  }),
  isDisabled: z.boolean(),
  totalQuantity: z.number(),
});

export const stockChangeResponseSchema = z.object({
  id: uuid(),
  productId: uuid(),
  businessId: uuid(),
  quantity: z.number(),
  type: z.string(),
  expirationDate: datetime().nullable(),
  createdByUserId: uuid(),
  createdAt: datetime(),
  updatedAt: datetime(),
  deletedAt: datetime().nullable(),
});

export type StockLevelResponse = z.infer<typeof stockLevelResponseSchema>;
export type StockChangeResponse = z.infer<typeof stockChangeResponseSchema>;
