import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";
import { AppointmentStatusEnum } from "./shared";

const ServiceCategorySchema = z.object({
  id: uuid(),
  name: z.string(),
});

const ServiceDefinitionSchema = z.object({
  id: uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: ServiceCategorySchema.nullable().optional(),
  duration: z.number(),
  price: z.number(), // cents
});

const EmployeeSchema = z.object({
  id: uuid(),
  name: z.string(),
  email: z.string(),
});

const ServiceSchema = z.object({
  id: uuid(),
  employee: EmployeeSchema,
  serviceDefinition: ServiceDefinitionSchema,
});

export const AppointmentResponseSchema = z.object({
  id: uuid(),
  customerName: z.string(),
  customerPhone: z.string().nullable(),
  customerEmail: z.string().nullable(),
  startTime: datetime(),
  status: AppointmentStatusEnum,
  notes: z.string().nullable(),
  service: ServiceSchema,
  createdById: uuid(),
  createdAt: datetime(),
  updatedAt: datetime(),
});

export type AppointmentResponse = z.infer<typeof AppointmentResponseSchema>;
