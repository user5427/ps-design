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

export const DayOfWeekSchema = z.union([
  z.literal("MON"),
  z.literal("TUE"),
  z.literal("WED"),
  z.literal("THU"),
  z.literal("FRI"),
  z.literal("SAT"),
  z.literal("SUN"),
]);

export const TimeStringSchema = z
  .string()
  .regex(TIME_REGEX, TIME_FORMAT_MESSAGE);