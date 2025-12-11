import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAvailabilityByServiceId,
  bulkSetAvailability,
} from "@/api/appointments";
import type { BulkSetAvailabilityBody } from "@ps-design/schemas/appointments/availability";

export const availabilityKeys = {
  all: ["appointments", "availability"] as const,
  byService: (serviceId: string) =>
    [...availabilityKeys.all, serviceId] as const,
};

export function useAvailabilityByService(serviceId: string | undefined) {
  return useQuery({
    queryKey: availabilityKeys.byService(serviceId ?? ""),
    queryFn: () => getAvailabilityByServiceId(serviceId!),
    enabled: !!serviceId,
  });
}

export function useBulkSetAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      serviceId,
      data,
    }: {
      serviceId: string;
      data: BulkSetAvailabilityBody;
    }) => bulkSetAvailability(serviceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: availabilityKeys.byService(variables.serviceId),
      });
    },
  });
}
