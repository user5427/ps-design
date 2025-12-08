import { z } from "zod";
import { uuid } from "./zod-utils";

export const BulkDeleteSchema = z.object({
  ids: z.array(uuid()).min(1, "At least one ID is required"),
});

export type BulkDeleteBody = z.infer<typeof BulkDeleteSchema>;
