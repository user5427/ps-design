import { z } from "zod";
import { uuid } from "../../shared/zod-utils";
import { DiningTableStatusSchema } from "./response-types";

export const TableIdParam = z.object({ tableId: uuid() });

export const UpdateFloorTableSchema = z.object({
  reserved: z.boolean().optional(),
  status: DiningTableStatusSchema.optional(),
});

export const CreateFloorTableSchema = z.object({
  label: z.string().min(1).max(50),
  capacity: z.number().int().positive().max(20),
});

export type TableIdParams = z.infer<typeof TableIdParam>;
export type UpdateFloorTableBody = z.infer<typeof UpdateFloorTableSchema>;
export type CreateFloorTableBody = z.infer<typeof CreateFloorTableSchema>;
