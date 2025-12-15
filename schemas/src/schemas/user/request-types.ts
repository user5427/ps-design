import { z } from "zod";
import { uuid } from "../shared/zod-utils";

const MIN_PASSWORD_LENGTH = 8;
const MIN_PASSWORD_MESSAGE = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;

export const UserIdParam = z.object({
  userId: uuid(),
});

export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(MIN_PASSWORD_LENGTH, MIN_PASSWORD_MESSAGE),
  businessId: uuid(),
  isOwner: z.boolean().optional(),
});

export const UpdateUserSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  name: z.string().min(1, "Name is required").optional(),
  businessId: uuid().optional(),
});

export const AssignRolesSchema = z.object({
  roleIds: z.array(uuid()),
});

export const UserQuerySchema = z.object({
  businessId: uuid().optional(),
});

export const RemoveRoleParam = z.object({
  userId: uuid(),
  roleId: uuid(),
});

export type UserIdParams = z.infer<typeof UserIdParam>;
export type CreateUserBody = z.infer<typeof CreateUserSchema>;
export type UpdateUserBody = z.infer<typeof UpdateUserSchema>;
export type AssignRolesBody = z.infer<typeof AssignRolesSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;
export type RemoveRoleParams = z.infer<typeof RemoveRoleParam>;
