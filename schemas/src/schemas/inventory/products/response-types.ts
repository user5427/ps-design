import { z } from "zod";
import { uuid } from "@/schemas/shared/zod-utils";

export const ProductResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  description: z.string().nullable(),
  productUnitId: uuid(),
  businessId: uuid(),
  isDisabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductResponse = z.infer<typeof ProductResponseSchema>;
