import { z } from "zod";
import { uuid } from "../shared/zod-utils";

export const RoleResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  description: z.string().nullable(),
  businessId: uuid(),
  isSystemRole: z.boolean(),
  isDeletable: z.boolean(),
  scopes: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RolesResponseSchema = z.array(RoleResponseSchema);

export type RoleResponse = z.infer<typeof RoleResponseSchema>;
export type RolesResponse = z.infer<typeof RolesResponseSchema>;
