import { z } from "zod";
import { uuid } from "../shared/zod-utils";

const RoleInUserSchema = z.object({
  id: uuid(),
  name: z.string(),
  description: z.string().nullable(),
});

export const UserResponseSchema = z.object({
  id: uuid(),
  email: z.string().email(),
  name: z.string(),
  businessId: uuid().nullable(),
  roles: z.array(RoleInUserSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UsersResponseSchema = z.array(UserResponseSchema);

export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UsersResponse = z.infer<typeof UsersResponseSchema>;
export type RoleInUser = z.infer<typeof RoleInUserSchema>;
