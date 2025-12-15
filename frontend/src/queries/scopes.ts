import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { ScopesResponse } from "@ps-design/schemas/scope";

export const SCOPES_QUERY_KEY = ["scopes"];

export function useScopes(businessId?: string) {
  return useQuery({
    queryKey: [...SCOPES_QUERY_KEY, businessId],
    queryFn: async () => {
      const params = businessId ? { businessId } : {};
      const response = await apiClient.get<ScopesResponse>("/scopes", {
        params,
      });
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
  });
}
