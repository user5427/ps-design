import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";

const EmployeeSchema = z.object({
  id: uuid(),
  name: z.string(),
  email: z.string(),
});

const ServiceCategorySchema = z.object({
  id: uuid(),
  name: z.string(),
});

const ServiceDefinitionSchema = z.object({
  id: uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  duration: z.number(),
  category: ServiceCategorySchema.nullable().optional(),
});

export const StaffServiceResponseSchema = z.object({
  id: uuid(),
  isDisabled: z.boolean(),
  employee: EmployeeSchema,
  serviceDefinition: ServiceDefinitionSchema,
  createdAt: datetime(),
  updatedAt: datetime(),
});

export type StaffServiceResponse = z.infer<typeof StaffServiceResponseSchema>;
