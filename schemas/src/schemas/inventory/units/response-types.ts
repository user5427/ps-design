import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";

export const ProductUnitResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  symbol: z.string().nullable(),
  businessId: uuid(),
  createdAt: datetime(),
  updatedAt: datetime(),
  deletedAt: datetime().nullable(),
});

export type ProductUnitResponse = z.infer<typeof ProductUnitResponseSchema>;
