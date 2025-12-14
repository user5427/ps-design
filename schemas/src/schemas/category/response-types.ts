import { z } from "zod";
import { datetime, uuid } from "../shared/zod-utils";

export const CategoryResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  businessId: uuid(),
  createdAt: datetime(),
  updatedAt: datetime(),
  deletedAt: datetime().nullable(),
});

export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
