import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import type { Appointment } from "@/schemas/appointments";
import dayjs from "dayjs";

interface PayModalProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

const PayModalTitle = () => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <PaymentIcon color="primary" />
    Payment
  </Box>
);

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Typography>
    <strong>{label}:</strong> {value}
  </Typography>
);

export const PayModal: React.FC<PayModalProps> = ({
  open,
  onClose,
  appointment,
}) => {
  if (!appointment) return null;

  const price = appointment.service?.serviceDefinition?.price ?? 0;
  const serviceName = appointment.service?.serviceDefinition?.name ?? "Service";
  const startTimeLabel = dayjs(appointment.startTime).format(
    "YYYY-MM-DD HH:mm",
  );
  const totalLabel = `€${price.toFixed(2)}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <PayModalTitle />
      </DialogTitle>
      <DialogContent>
        <Stack sx={{ py: 2 }} spacing={2}>
          <Typography variant="h6">Appointment Details</Typography>
          <Stack spacing={1}>
            <DetailRow label="Customer" value={appointment.customerName} />
            <DetailRow label="Service" value={serviceName} />
            <DetailRow label="Date" value={startTimeLabel} />
          </Stack>
          <Typography variant="h5" color="primary">
            Total: {totalLabel}
          </Typography>
        </Stack>
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
