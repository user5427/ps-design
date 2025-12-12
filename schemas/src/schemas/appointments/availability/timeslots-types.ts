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
