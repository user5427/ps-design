import { useQuery } from "@tanstack/react-query";
import { getBusinessUsers } from "@/api/business";
import type { BusinessUserResponse } from "@ps-design/schemas/business";

export const useBusinessUsers = (businessId: string | undefined) => {
  return useQuery<BusinessUserResponse[], Error>({
    queryKey: ["businessUsers", businessId],
    queryFn: () => {
      if (!businessId) {
        throw new Error("Business ID is required");
      }
      return getBusinessUsers(businessId);
    },
    enabled: !!businessId,
  });
};
