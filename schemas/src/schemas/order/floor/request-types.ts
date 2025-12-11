import { z } from "zod";
import { uuid } from "../../shared/zod-utils";
import { DiningTableStatusSchema } from "./response-types";

export const TableIdParam = z.object({ tableId: uuid() });

export const UpdateFloorTableSchema = z.object({
  reserved: z.boolean().optional(),
  status: DiningTableStatusSchema.optional(),
});

export type TableIdParams = z.infer<typeof TableIdParam>;
export type UpdateFloorTableBody = z.infer<typeof UpdateFloorTableSchema>;
