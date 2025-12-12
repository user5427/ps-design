import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";
import { DayOfWeekSchema, TimeStringSchema } from "./shared";

export const AvailabilityResponseSchema = z.object({
  id: uuid(),
  dayOfWeek: DayOfWeekSchema,
  startTime: TimeStringSchema,
  endTime: TimeStringSchema,
  isOvernight: z.boolean(),
  userId: uuid(),
  businessId: uuid(),
  createdAt: datetime(),
  updatedAt: datetime(),
});

export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;

export const TimeSlotSchema = z.object({
  startTime: datetime(),
  endTime: datetime(),
  isAvailable: z.boolean(),
  appointmentId: z.uuid().nullable(),
  employeeId: uuid(),
  employeeName: z.string(),
  staffServiceId: uuid().nullable(),
});

export type TimeSlot = z.infer<typeof TimeSlotSchema>;

export const AvailableTimeSlotsResponseSchema = z.object({
  date: datetime(),
  slots: z.array(TimeSlotSchema),
});

export type AvailableTimeSlotsResponse = z.infer<
  typeof AvailableTimeSlotsResponseSchema
>;

export const AvailabilityBlockSchema = z.object({
  startTime: datetime(),
  endTime: datetime(),
  type: z.enum(["FREE", "OCCUPIED"]),
  employeeId: uuid(),
  employeeName: z.string(),
  staffServiceId: uuid().nullable(),
  appointmentId: uuid().nullable().optional(),
});

export type AvailabilityBlock = z.infer<typeof AvailabilityBlockSchema>;

export const AvailabilityBlocksResponseSchema = z.object({
  date: datetime(),
  blocks: z.array(AvailabilityBlockSchema),
});

export type AvailabilityBlocksResponse = z.infer<
  typeof AvailabilityBlocksResponseSchema
>;
