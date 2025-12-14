import { z } from "zod";
import { uuid, datetime } from "../shared/zod-utils";

export const TaxResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  description: z.string().nullable(),
  rate: z.number(),
  businessId: uuid(),
  createdAt: datetime(),
  updatedAt: datetime(),
  deletedAt: datetime().nullable(),
});

export const TaxListResponseSchema = z.array(TaxResponseSchema);

export type TaxResponse = z.infer<typeof TaxResponseSchema>;
export type TaxListResponse = z.infer<typeof TaxListResponseSchema>;