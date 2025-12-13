import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkDeleteStaffServices,
  createStaffService,
  getStaffServices,
  updateStaffService,
} from "@/api/appointments";
import type {
  CreateServiceBody,
  UpdateServiceBody,
} from "@ps-design/schemas/appointments/service";

export const staffServiceKeys = {
  all: ["appointments", "staffServices"] as const,
};

export function useStaffServices() {
  return useQuery({
    queryKey: staffServiceKeys.all,
    queryFn: getStaffServices,
  });
}

export function useCreateStaffService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceBody) => createStaffService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffServiceKeys.all });
    },
  });
}

export function useUpdateStaffService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceBody }) =>
      updateStaffService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffServiceKeys.all });
    },
  });
}

export function useBulkDeleteStaffServices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteStaffServices(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffServiceKeys.all });
    },
  });
}
