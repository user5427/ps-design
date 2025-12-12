import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Box,
  Alert,
  Chip,
} from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import {
  AvailabilityTimetable,
  type AppointmentTimeSelection,
} from "./availability-timetable";

interface CreateAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (values: {
    serviceId: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    startTime: string;
    notes?: string;
  }) => Promise<void>;
  staffServiceOptions: Array<{
    label: string;
    value: string;
    baseDuration: number;
  }>;
  serviceDefinitionOptions: Array<{
    label: string;
    value: string;
    baseDuration: number;
  }>;
}

export const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  open,
  onClose,
  onCreate,
  staffServiceOptions,
  serviceDefinitionOptions,
}) => {
  const [serviceDefinitionId, setServiceDefinitionId] = useState("");
  const [selection, setSelection] = useState<AppointmentTimeSelection | null>(
    null,
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = staffServiceOptions.find(
    (s) => s.value === (selection?.staffServiceId || ""),
  );
  const selectedServiceDef = serviceDefinitionOptions.find(
    (s) => s.value === serviceDefinitionId,
  );
  const duration = selectedServiceDef?.baseDuration || 30;

  const handleSlotClick = (data: AppointmentTimeSelection) => {
    setSelection(data);
  };

  const handleSubmit = async () => {
    if (!selection || !customerName) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        serviceId: selection.staffServiceId,
        customerName,
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        startTime: selection.startTime,
        notes: notes || undefined,
      });
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setServiceDefinitionId("");
    setSelection(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setNotes("");
    onClose();
  };

  // Format time period display
  const getTimePeriodDisplay = () => {
    if (!selection) return null;

    const startTime = dayjs(selection.startTime);
    const endTime = dayjs(selection.endTime);

    const startDate = startTime.format("YYYY-MM-DD");
    const endDate = endTime.format("YYYY-MM-DD");
    const startTimeStr = startTime.format("HH:mm");
    const endTimeStr = endTime.format("HH:mm");

    // Check if it's overnight (different dates)
    if (startDate !== endDate) {
      return `${startTime.format("YYYY-MM-DD HH:mm")} - ${endTime.format("YYYY-MM-DD HH:mm")}`;
    }

    // Same day
    return `${startDate} ${startTimeStr} - ${endTimeStr}`;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Create Appointment</DialogTitle>
      <DialogContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{ mt: 0.5 }}
        >
          {/* Left Column - Form */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack spacing={2}>
              {/* Selected Time Period Display */}
              {selection && (
                <Alert severity="info" icon={<CalendarIcon />}>
                  <Stack spacing={0.5}>
                    <Box sx={{ fontWeight: 600 }}>Selected Appointment</Box>
                    {selectedService && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        Service:{" "}
                        <Chip
                          label={selectedService.label}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    )}
                    {selection.employeeName && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        Employee:{" "}
                        <Chip label={selection.employeeName} size="small" />
                      </Box>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TimeIcon fontSize="small" />
                      {getTimePeriodDisplay()}
                    </Box>
                  </Stack>
                </Alert>
              )}

              {!selection && (
                <Alert severity="warning">
                  Please select an available time slot from the timetable on the
                  right
                </Alert>
              )}

              <TextField
                label="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                fullWidth
              />

              <TextField
                label="Customer Phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                fullWidth
              />

              <TextField
                label="Customer Email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                fullWidth
              />

              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                fullWidth
              />
            </Stack>
          </Box>

          {/* Right Column - Timetable */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <AvailabilityTimetable
              serviceDefinitionId={serviceDefinitionId}
              durationMinutes={duration}
              onSlotClick={handleSlotClick}
              serviceDefinitionOptions={serviceDefinitionOptions}
              onServiceDefinitionChange={setServiceDefinitionId}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selection || !customerName || isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
