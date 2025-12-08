import { z } from "zod";
import { uuid } from "../../shared/zod-utils";

export const ProductUnitResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  symbol: z.string().nullable(),
  businessId: uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductUnitResponse = z.infer<typeof ProductUnitResponseSchema>;
