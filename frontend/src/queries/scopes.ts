import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { ScopesResponse } from "@ps-design/schemas/scope";

export const SCOPES_QUERY_KEY = ["scopes"];

export function useScopes() {
  return useQuery({
    queryKey: SCOPES_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<ScopesResponse>("/scopes");
      return response.data;
    },
  });
}
