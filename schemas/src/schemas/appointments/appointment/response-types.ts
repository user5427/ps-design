import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";
import { AppointmentStatusEnum } from "./shared";

const CategorySchema = z.object({
  id: uuid(),
  name: z.string(),
});

const ServiceDefinitionSchema = z.object({
  id: uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: CategorySchema.nullable().optional(),
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

const PaymentLineItemSchema = z.object({
  id: uuid(),
  type: z.enum(["SERVICE", "TIP", "DISCOUNT", "TAX"]),
  label: z.string(),
  amount: z.number(), // cents
});

const AppointmentPaymentResponseSchema = z.object({
  id: uuid(),
  servicePrice: z.number(),
  serviceDuration: z.number(),
  paymentMethod: z.enum(["CASH", "GIFTCARD", "STRIPE"]),
  tipAmount: z.number(),
  totalAmount: z.number(),
  paidAt: datetime(),
  refundedAt: datetime().nullable(),
  refundReason: z.string().nullable(),
  lineItems: z.array(PaymentLineItemSchema),
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
  payment: AppointmentPaymentResponseSchema.nullable().optional(),
  createdById: uuid(),
  createdAt: datetime(),
  updatedAt: datetime(),
});

export type AppointmentResponse = z.infer<typeof AppointmentResponseSchema>;
