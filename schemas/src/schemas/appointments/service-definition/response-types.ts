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
  price: z.number(),
  baseDuration: z.number(),
  isDisabled: z.boolean(),
  category: ServiceCategorySchema.nullable().optional(),
  createdAt: datetime(),
  updatedAt: datetime(),
});

export type ServiceDefinitionResponse = z.infer<
  typeof ServiceDefinitionResponseSchema
>;
