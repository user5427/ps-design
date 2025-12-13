import { z } from "zod";

export const AppointmentStatusEnum = z.enum(["RESERVED", "CANCELLED", "PAID", "REFUNDED"]);

