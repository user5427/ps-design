import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";

const ServiceCategorySchema = z.object({
  id: uuid(),
  name: z.string(),
});

export const ServiceDefinitionResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isDisabled: z.boolean(),
  category: ServiceCategorySchema.nullable().optional(),
  createdAt: datetime(),
  updatedAt: datetime(),
  deletedAt: datetime().nullable(),
});

export type ServiceDefinitionResponse = z.infer<
  typeof ServiceDefinitionResponseSchema
>;
