import { z } from "zod";
import { uuid } from "../../shared/zod-utils";

export const DiningTableStatusSchema = z.enum([
  "AVAILABLE",
  "ACTIVE",
  "ATTENTION",
]);

export const FloorTableSchema = z.object({
  id: uuid(),
  label: z.string(),
  capacity: z.number().int().positive(),
  status: DiningTableStatusSchema,
  reserved: z.boolean().default(false),
  orderId: uuid().nullable(),
});

export const FloorPlanResponseSchema = z.object({
  tables: z.array(FloorTableSchema),
});

export type DiningTableStatus = z.infer<typeof DiningTableStatusSchema>;
export type FloorTable = z.infer<typeof FloorTableSchema>;
export type FloorPlanResponse = z.infer<typeof FloorPlanResponseSchema>;
