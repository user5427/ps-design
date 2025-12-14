import { ConfirmationDialog } from "@/components/elements/form";
import type { Appointment } from "@/schemas/appointments";
import dayjs from "dayjs";

interface CancelAppointmentDialogProps {
  open: boolean;
  appointment: Appointment | null;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const CancelAppointmentDialog: React.FC<
  CancelAppointmentDialogProps
> = ({ open, appointment, isLoading = false, onCancel, onConfirm }) => {
  const description = appointment
    ? `Are you sure you want to cancel this appointment for ${appointment.customerName}? Scheduled for ${dayjs(appointment.startTime).format("YYYY-MM-DD HH:mm")}.`
    : "Are you sure you want to cancel this appointment?";

  return (
    <ConfirmationDialog
      open={open}
      title="Cancel Appointment"
      description={description}
      onCancel={onCancel}
      onConfirm={onConfirm}
      isLoading={isLoading}
      confirmText="Yes, Cancel Appointment"
      cancelText="No, Keep It"
      confirmColor="error"
    />
  );
};
