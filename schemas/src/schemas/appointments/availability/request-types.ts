import { z } from "zod";
import { uuid } from "../../shared/zod-utils";
import { DayOfWeekSchema, TimeStringSchema } from "./shared";

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const NEXT_DAY: Record<string, string> = {
  MON: "TUE",
  TUE: "WED",
  WED: "THU",
  THU: "FRI",
  FRI: "SAT",
  SAT: "SUN",
  SUN: "MON",
};

export const AvailabilityIdParam = z.object({ availabilityId: uuid() });
export const UserIdForAvailabilityParam = z.object({
  userId: uuid(),
});

export const CreateAvailabilitySchema = z
  .object({
    dayOfWeek: DayOfWeekSchema,
    startTime: TimeStringSchema,
    endTime: TimeStringSchema,
    isOvernight: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    const startMins = timeToMinutes(data.startTime);
    const endMins = timeToMinutes(data.endTime);

    if (data.isOvernight) {
      // For overnight shifts, end time should be less than start time (e.g., 23:00 - 01:00)
      if (endMins >= startMins) {
        ctx.addIssue({
          code: "custom",
          message:
            "For overnight shifts, end time must be earlier than start time (next day)",
          path: ["endTime"],
        });
      }
    } else {
      // For regular shifts, end time must be after start time
      if (startMins >= endMins) {
        ctx.addIssue({
          code: "custom",
          message: "End time must be after start time",
          path: ["endTime"],
        });
      }
    }
  });

export const BulkSetAvailabilitySchema = z.object({
  availabilities: z
    .array(CreateAvailabilitySchema)
    .superRefine((items, ctx) => {
      const slotsByDay: Record<
        string,
        Array<{ start: number; end: number; index: number }>
      > = {};

      items.forEach((item, index) => {
        const startMins = timeToMinutes(item.startTime);
        const endMins = timeToMinutes(item.endTime);

        slotsByDay[item.dayOfWeek] = slotsByDay[item.dayOfWeek] || [];
        if (item.isOvernight) {
          slotsByDay[item.dayOfWeek].push({
            start: startMins,
            end: 24 * 60,
            index,
          });

          const nextDay = NEXT_DAY[item.dayOfWeek];
          slotsByDay[nextDay] = slotsByDay[nextDay] || [];
          slotsByDay[nextDay].push({ start: 0, end: endMins, index });
        } else {
          slotsByDay[item.dayOfWeek].push({
            start: startMins,
            end: endMins,
            index,
          });
        }
      });

      // Check for overlaps
      for (const dayKey of Object.keys(slotsByDay)) {
        const slots = slotsByDay[dayKey];
        if (slots.length < 2) continue;

        const sorted = [...slots].sort((a, b) => a.start - b.start);

        for (let i = 0; i < sorted.length - 1; i++) {
          const current = sorted[i];
          const next = sorted[i + 1];

          if (next.start < current.end) {
            ctx.addIssue({
              code: "custom",
              message: `Overlapping availability on ${dayKey}`,
              path: [next.index, "startTime"],
            });
          }
        }
      }
    }),
});

export type CreateAvailabilityBody = z.infer<typeof CreateAvailabilitySchema>;
export type BulkSetAvailabilityBody = z.infer<typeof BulkSetAvailabilitySchema>;
export type AvailabilityIdParams = z.infer<typeof AvailabilityIdParam>;
export type UserIdForAvailabilityParams = z.infer<
  typeof UserIdForAvailabilityParam
>;
