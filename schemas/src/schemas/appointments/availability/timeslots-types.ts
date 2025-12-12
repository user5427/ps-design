import { z } from "zod";

export const GetAvailableTimeSlotsQuerySchema = z.object({
  staffServiceId: z.string().uuid().optional(),
  serviceDefinitionId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  date: z.string().datetime(),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(1)
    .max(480)
    .optional()
    .default(30),
});

export type GetAvailableTimeSlotsQuery = z.infer<
  typeof GetAvailableTimeSlotsQuerySchema
>;

export const TimeSlotSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  isAvailable: z.boolean(),
  appointmentId: z.string().uuid().nullable(),
  employeeId: z.string().uuid(),
  employeeName: z.string(),
  staffServiceId: z.string().uuid().nullable(),
});

export type TimeSlot = z.infer<typeof TimeSlotSchema>;

export const AvailableTimeSlotsResponseSchema = z.object({
  date: z.string().datetime(),
  slots: z.array(TimeSlotSchema),
});

export type AvailableTimeSlotsResponse = z.infer<
  typeof AvailableTimeSlotsResponseSchema
>;

// Availability Blocks - continuous free/occupied periods
export const AvailabilityBlockSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.enum(["FREE", "OCCUPIED"]),
  employeeId: z.string().uuid(),
  employeeName: z.string(),
  staffServiceId: z.string().uuid().nullable(),
  appointmentId: z.string().uuid().nullable().optional(),
});

export type AvailabilityBlock = z.infer<typeof AvailabilityBlockSchema>;

export const GetAvailabilityBlocksQuerySchema = z.object({
  staffServiceId: z.string().uuid().optional(),
  serviceDefinitionId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  date: z.string().datetime(),
});

export type GetAvailabilityBlocksQuery = z.infer<
  typeof GetAvailabilityBlocksQuerySchema
>;

export const AvailabilityBlocksResponseSchema = z.object({
  date: z.string().datetime(),
  blocks: z.array(AvailabilityBlockSchema),
});

export type AvailabilityBlocksResponse = z.infer<
  typeof AvailabilityBlocksResponseSchema
>;
