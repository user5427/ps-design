import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";

export const ProductResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  description: z.string().nullable(),
  productUnitId: uuid(),
  businessId: uuid(),
  isDisabled: z.boolean(),
  createdAt: datetime(),
  updatedAt: datetime(),
  deletedAt: datetime().nullable(),
  productUnit: z.object({
    id: uuid(),
    name: z.string(),
    symbol: z.string().nullable(),
  }),
});

export type ProductResponse = z.infer<typeof ProductResponseSchema>;
