import { z } from "zod";
import { uuid } from "../shared/zod-utils";

const MIN_NAME_LENGTH = 1;
const MIN_NAME_MESSAGE = `Name must be at least ${MIN_NAME_LENGTH} characters`;

export const RoleIdParam = z.object({
  roleId: uuid(),
});

export const CreateRoleSchema = z.object({
  name: z.string().min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE),
  description: z.string().optional(),
  businessId: uuid(),
  scopes: z.array(z.string()),
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(MIN_NAME_LENGTH, MIN_NAME_MESSAGE).optional(),
  description: z.string().optional(),
});

export const AssignScopesSchema = z.object({
  scopes: z.array(z.string()),
});

export const RoleQuerySchema = z.object({
  businessId: uuid().optional(),
});

export type RoleIdParams = z.infer<typeof RoleIdParam>;
export type CreateRoleBody = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleBody = z.infer<typeof UpdateRoleSchema>;
export type AssignScopesBody = z.infer<typeof AssignScopesSchema>;
export type RoleQuery = z.infer<typeof RoleQuerySchema>;
