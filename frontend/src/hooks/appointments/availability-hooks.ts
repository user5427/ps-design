import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAvailabilityByUserId,
  bulkSetAvailability,
} from "@/api/appointments";
import type { BulkSetAvailabilityBody } from "@ps-design/schemas/appointments/availability";

export const availabilityKeys = {
  all: ["availability"] as const,
  user: (userId: string) => [...availabilityKeys.all, "user", userId] as const,
};

export function useUserAvailability(userId: string | undefined) {
  return useQuery({
    queryKey: availabilityKeys.user(userId!),
    queryFn: () => getAvailabilityByUserId(userId!),
    enabled: !!userId,
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: BulkSetAvailabilityBody;
    }) => bulkSetAvailability(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.user(userId),
      });
    },
  });
}
