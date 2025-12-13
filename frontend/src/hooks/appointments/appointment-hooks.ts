import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkDeleteAppointments,
  createAppointment,
  getAppointments,
  updateAppointment,
  updateAppointmentStatus,
  payAppointment,
  refundAppointment,
} from "@/api/appointments";
import type {
  CreateAppointmentBody,
  UpdateAppointmentBody,
  AppointmentStatus,
  PayAppointmentBody,
  RefundAppointmentBody,
} from "@ps-design/schemas/appointments/appointment";

export const appointmentKeys = {
  all: ["appointments", "appointments"] as const,
  list: () => [...appointmentKeys.all] as const,
};

export function useAppointments() {
  return useQuery({
    queryKey: appointmentKeys.list(),
    queryFn: () => getAppointments(),
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentBody) => createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppointmentBody }) =>
      updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

export function useBulkDeleteAppointments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteAppointments(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

export function usePayAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayAppointmentBody }) =>
      payAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

export function useRefundAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RefundAppointmentBody }) =>
      refundAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}
