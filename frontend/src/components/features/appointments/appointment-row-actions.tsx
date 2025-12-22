import { IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import PaymentIcon from "@mui/icons-material/Payment";
import RefundIcon from "@mui/icons-material/Undo";
import ReceiptIcon from "@mui/icons-material/Receipt";
import type { Appointment } from "@/schemas/appointments";
import { generateAppointmentReceiptPdf } from "@/utils/generate-receipt-pdf";

interface AppointmentRowActionsProps {
  appointment: Appointment;
  openEditModal: (record: Appointment) => void;
  onCancel: () => void;
  onPay: () => void;
  onRefund: () => void;
}

export const AppointmentRowActions: React.FC<AppointmentRowActionsProps> = ({
  appointment,
  openEditModal,
  onCancel,
  onPay,
  onRefund,
}) => {
  if (appointment.status === "RESERVED") {
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
  }

  if (appointment.status === "PAID" || appointment.status === "REFUNDED") {
    const handlePrintReceipt = () => {
      generateAppointmentReceiptPdf(appointment);
    };

    return (
      <>
        <Tooltip title="Print Receipt">
          <IconButton size="small" color="primary" onClick={handlePrintReceipt}>
            <ReceiptIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {appointment.status === "PAID" && (
          <Tooltip title="Refund">
            <IconButton size="small" color="warning" onClick={onRefund}>
              <RefundIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </>
    );
  }

  return null;
};
