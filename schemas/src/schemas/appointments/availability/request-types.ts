import { z } from "zod";
import { uuid } from "../../shared/zod-utils";
import { DayOfWeekSchema, TimeStringSchema } from "./shared";

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// Check for overlaps in a list of time slots
// Returns the index of the conflicting item or -1 if valid
const findOverlapIndex = (
  slots: { startTimeLocal: string; endTimeLocal: string }[]
): number => {
  // Sort by start time
  const sorted = [...slots].map((s, i) => ({ ...s, originalIndex: i }))
    .sort((a, b) => timeToMinutes(a.startTimeLocal) - timeToMinutes(b.startTimeLocal));

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (timeToMinutes(next.startTimeLocal) < timeToMinutes(current.endTimeLocal)) {
      // Return the second conflicting slot
      return next.originalIndex; 
    }
  }
  return -1;
};

export const AvailabilityIdParam = z.object({ availabilityId: uuid() });
export const ServiceIdForAvailabilityParam = z.object({
  serviceId: uuid(),
});

export const CreateAvailabilitySchema = z
  .object({
    dayOfWeek: DayOfWeekSchema,
    startTimeLocal: TimeStringSchema,
    endTimeLocal: TimeStringSchema,
  })
  .superRefine((data, ctx) => {
    const startMins = timeToMinutes(data.startTimeLocal);
    const endMins = timeToMinutes(data.endTimeLocal);

    if (startMins >= endMins) {
      ctx.addIssue({ code: "custom", message: "End time must be after start time", path: ["endTimeLocal"] });
      return;
    }

  });

export const BulkSetAvailabilitySchema = z.object({
  availabilities: z
    .array(CreateAvailabilitySchema)
    .superRefine((items, ctx) => {
      const slotsByDay: Record<string, typeof items> = {};
      
      items.forEach(item => {
        slotsByDay[item.dayOfWeek] = slotsByDay[item.dayOfWeek] || [];
        slotsByDay[item.dayOfWeek].push(item);
      });

      for (const dayKey of Object.keys(slotsByDay)) {
        const slots = slotsByDay[dayKey]; 
        const dayNumber = Number(dayKey); 

        if (slots.length > 1) {
          const conflictIndex = findOverlapIndex(slots); 
          
          if (conflictIndex !== -1) {
            const conflictingSlot = slots[conflictIndex];
            const actualIndex = items.indexOf(conflictingSlot);

            ctx.addIssue({
              code: "custom",
              message: `Overlapping shifts detected on day ${dayNumber}. Split shifts must have a gap between them.`,
              path: [actualIndex, "startTimeLocal"],
            });
          }
        }
      }
    }),
});

export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;
export type CreateAvailabilityBody = z.infer<typeof CreateAvailabilitySchema>;
export type BulkSetAvailabilityBody = z.infer<typeof BulkSetAvailabilitySchema>;
export type AvailabilityIdParams = z.infer<typeof AvailabilityIdParam>;
export type StaffServiceIdForAvailabilityParams = z.infer<typeof ServiceIdForAvailabilityParam>;