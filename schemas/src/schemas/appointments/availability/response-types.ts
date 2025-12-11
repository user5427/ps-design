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
