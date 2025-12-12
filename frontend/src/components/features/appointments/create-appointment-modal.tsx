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
import dayjs, { type Dayjs } from "dayjs";
import { AvailabilityTimetable } from "./availability-timetable";

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
  const [serviceId, setServiceId] = useState("");
  const [serviceDefinitionId, setServiceDefinitionId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [employeeName, setEmployeeName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = staffServiceOptions.find(
    (s) => s.value === serviceId,
  );
  const selectedServiceDef = serviceDefinitionOptions.find(
    (s) => s.value === serviceDefinitionId,
  );
  const duration = selectedServiceDef?.baseDuration || 30;

  const handleSlotClick = (data: {
    startTime: string;
    endTime: string;
    employeeId: string;
    employeeName: string;
    staffServiceId: string;
  }) => {
    setStartTime(dayjs(data.startTime));
    setEndTime(dayjs(data.endTime));
    setEmployeeName(data.employeeName);
    // Set the staff service from the clicked slot
    if (data.staffServiceId) {
      setServiceId(data.staffServiceId);
    }
  };

  const handleSubmit = async () => {
    if (!serviceId || !customerName || !startTime) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        serviceId,
        customerName,
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        startTime: startTime.toISOString(),
        notes: notes || undefined,
      });
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setServiceId("");
    setServiceDefinitionId("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setStartTime(null);
    setEndTime(null);
    setEmployeeName("");
    setNotes("");
    onClose();
  };

  // Format time period display
  const getTimePeriodDisplay = () => {
    if (!startTime || !endTime) return null;

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
              {startTime && endTime && (
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
                    {employeeName && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        Employee: <Chip label={employeeName} size="small" />
                      </Box>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TimeIcon fontSize="small" />
                      {getTimePeriodDisplay()}
                    </Box>
                  </Stack>
                </Alert>
              )}

              {!startTime && (
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
          disabled={!serviceId || !customerName || !startTime || isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
