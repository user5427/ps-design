import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TIME_FORMAT_MESSAGE = "Time must be in HH:MM format (00:00 - 23:59)";

export const DayOfWeekLiteral = {
  MON: "MON",
  TUE: "TUE",
  WED: "WED",
  THU: "THU",
  FRI: "FRI",
  SAT: "SAT",
  SUN: "SUN",
} as const;

export const DayOfWeekSchema = z.enum([
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
]);

export const TimeStringSchema = z
  .string()
  .regex(TIME_REGEX, TIME_FORMAT_MESSAGE);

export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;
