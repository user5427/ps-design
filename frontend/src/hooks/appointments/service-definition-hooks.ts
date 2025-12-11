import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkDeleteServiceDefinitions,
  createServiceDefinition,
  getServiceDefinitions,
  updateServiceDefinition,
  type ServiceDefinitionFilters,
} from "@/api/appointments";
import type {
  CreateServiceDefinitionBody,
  UpdateServiceDefinitionBody,
} from "@ps-design/schemas/appointments/service-definition";

export const serviceDefinitionKeys = {
  all: ["appointments", "serviceDefinitions"] as const,
  list: (filters?: ServiceDefinitionFilters) =>
    [...serviceDefinitionKeys.all, filters] as const,
};

export function useServiceDefinitions(filters?: ServiceDefinitionFilters) {
  return useQuery({
    queryKey: serviceDefinitionKeys.list(filters),
    queryFn: () => getServiceDefinitions(filters),
  });
}

export function useCreateServiceDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceDefinitionBody) =>
      createServiceDefinition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceDefinitionKeys.all });
    },
  });
}

export function useUpdateServiceDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateServiceDefinitionBody;
    }) => updateServiceDefinition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceDefinitionKeys.all });
    },
  });
}

export function useBulkDeleteServiceDefinitions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteServiceDefinitions(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceDefinitionKeys.all });
    },
  });
}
