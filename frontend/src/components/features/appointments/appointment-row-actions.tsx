import { IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import PaymentIcon from "@mui/icons-material/Payment";
import type { Appointment } from "@/schemas/appointments";

interface AppointmentRowActionsProps {
  appointment: Appointment;
  openEditModal: (record: Appointment) => void;
  onCancel: () => void;
  onPay: () => void;
}

export const AppointmentRowActions: React.FC<AppointmentRowActionsProps> = ({
  appointment,
  openEditModal,
  onCancel,
  onPay,
}) => {
  if (appointment.status !== "RESERVED") return null;

  return (
    <>
      <Tooltip title="Edit">
        <IconButton size="small" onClick={() => openEditModal(appointment)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Cancel Appointment">
        <IconButton size="small" color="error" onClick={onCancel}>
          <CancelIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Pay">
        <IconButton size="small" color="primary" onClick={onPay}>
          <PaymentIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
};
