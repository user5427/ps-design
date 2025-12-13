import { z } from "zod";
import { uuid } from "../shared/zod-utils";

export const BusinessUserResponseSchema = z.object({
  id: uuid(),
  name: z.string(),
  email: z.string(),
});

export type BusinessUserResponse = z.infer<typeof BusinessUserResponseSchema>;

export const BusinessUsersResponseSchema = z.array(BusinessUserResponseSchema);

export type BusinessUsersResponse = z.infer<typeof BusinessUsersResponseSchema>;
