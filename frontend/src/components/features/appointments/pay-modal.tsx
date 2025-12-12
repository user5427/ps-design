import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import type { Appointment } from "@/schemas/appointments";
import dayjs from "dayjs";

interface PayModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export const PayModal: React.FC<PayModalProps> = ({
  open,
  onClose,
  appointment,
}) => {
  if (!appointment) return null;

  const price = appointment.service?.serviceDefinition?.price || 0;
  const serviceName = appointment.service?.serviceDefinition?.name || "Service";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PaymentIcon color="primary" />
          Payment
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="h6" gutterBottom>
            Appointment Details
          </Typography>
          <Box sx={{ display: "grid", gap: 1, mt: 2 }}>
            <Typography>
              <strong>Customer:</strong> {appointment.customerName}
            </Typography>
            <Typography>
              <strong>Service:</strong> {serviceName}
            </Typography>
            <Typography>
              <strong>Date:</strong>{" "}
              {dayjs(appointment.startTime).format("YYYY-MM-DD HH:mm")}
            </Typography>
            <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
              Total: €{price.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PaymentIcon />}
          onClick={onClose}
        >
          Confirm Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
};
