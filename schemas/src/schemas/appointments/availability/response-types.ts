import { z } from "zod";
import { datetime, uuid } from "../../shared/zod-utils";
import { DayOfWeekSchema, TimeStringSchema } from "./shared";

export const AvailabilityResponseSchema = z.object({
  id: uuid(),
  dayOfWeek: DayOfWeekSchema,
  startTimeLocal: TimeStringSchema, 
  endTimeLocal: TimeStringSchema,
  serviceId: uuid(),
  createdAt: datetime(),
  updatedAt: datetime(),
});

export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;