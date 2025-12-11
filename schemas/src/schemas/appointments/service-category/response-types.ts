import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";

export const ServiceCategoryResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  createdAt: datetime(),
  updatedAt: datetime(),
});

export type ServiceCategoryResponse = z.infer<
  typeof ServiceCategoryResponseSchema
>;
