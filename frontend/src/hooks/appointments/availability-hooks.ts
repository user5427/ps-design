import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAvailabilityByUserId,
  bulkSetAvailability,
  getAvailableTimeSlots,
  getAvailabilityBlocks,
} from "@/api/appointments";
import type {
  BulkSetAvailabilityBody,
  GetAvailableTimeSlotsQuery,
  GetAvailabilityBlocksQuery,
} from "@ps-design/schemas/appointments/availability";

export const availabilityKeys = {
  all: ["availability"] as const,
  user: (userId: string) => [...availabilityKeys.all, "user", userId] as const,
  timeSlots: (query: GetAvailableTimeSlotsQuery) =>
    [...availabilityKeys.all, "timeSlots", query] as const,
  blocks: (query: GetAvailabilityBlocksQuery) =>
    [...availabilityKeys.all, "blocks", query] as const,
};

export function useUserAvailability(userId: string | undefined) {
  return useQuery({
    queryKey: availabilityKeys.user(userId || ''),
    queryFn: () => {
      if (!userId) throw new Error('userId is required');
      return getAvailabilityByUserId(userId);
    },
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

export function useAvailableTimeSlots(query: GetAvailableTimeSlotsQuery) {
  return useQuery({
    queryKey: availabilityKeys.timeSlots(query),
    queryFn: () => getAvailableTimeSlots(query),
    enabled:
      !!query.date &&
      (!!query.staffServiceId ||
        !!query.serviceDefinitionId ||
        !!query.employeeId),
  });
}

export function useAvailabilityBlocks(query: GetAvailabilityBlocksQuery) {
  return useQuery({
    queryKey: availabilityKeys.blocks(query),
    queryFn: () => getAvailabilityBlocks(query),
    enabled:
      !!query.date &&
      (!!query.staffServiceId ||
        !!query.serviceDefinitionId ||
        !!query.employeeId),
  });
}
