import { z } from "zod";
import { uuid, datetime } from "../../shared/zod-utils";
import type { AppointmentStatusEnum } from "./shared";

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 100;
const MAX_NOTES_LENGTH = 1000;

export const AppointmentIdParam = z.object({ appointmentId: uuid() });

export const CreateAppointmentSchema = z.object({
  serviceId: uuid(),
  customerName: z
    .string()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} character`)
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`),
  customerPhone: z.string().nullable().optional(),
  customerEmail: z.email().nullable().optional(),
  startTime: datetime().superRefine((date, ctx) => {
    if (new Date(date) <= new Date()) {
      ctx.addIssue({
        code: "custom",
        message: "Cannot schedule appointments in the past",
        path: ["startTime"],
      });
    }
  }),
  notes: z
    .string()
    .max(
      MAX_NOTES_LENGTH,
      `Notes must be at most ${MAX_NOTES_LENGTH} characters`,
    )
    .nullable()
    .optional(),
});

export const UpdateAppointmentSchema = z.object({
  customerName: z
    .string()
    .min(MIN_NAME_LENGTH, `Name must be at least ${MIN_NAME_LENGTH} character`)
    .max(MAX_NAME_LENGTH, `Name must be at most ${MAX_NAME_LENGTH} characters`)
    .optional(),
  customerPhone: z.string().nullable().optional(),
  customerEmail: z.email().nullable().optional(),
  notes: z
    .string()
    .max(
      MAX_NOTES_LENGTH,
      `Notes must be at most ${MAX_NOTES_LENGTH} characters`,
    )
    .nullable()
    .optional(),
});

export type AppointmentStatus = z.infer<typeof AppointmentStatusEnum>;
export type CreateAppointmentBody = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentBody = z.infer<typeof UpdateAppointmentSchema>;
export type AppointmentIdParams = z.infer<typeof AppointmentIdParam>;
