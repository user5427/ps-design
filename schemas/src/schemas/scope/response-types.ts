import { z } from "zod";

export const ScopeResponseSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const ScopesResponseSchema = z.array(ScopeResponseSchema);

export type ScopeResponse = z.infer<typeof ScopeResponseSchema>;
export type ScopesResponse = z.infer<typeof ScopesResponseSchema>;
