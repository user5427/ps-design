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
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { type Dayjs } from "dayjs";
import { AvailabilityTimetable } from "./availability-timetable";
import type { TimeSlot } from "@ps-design/schemas/appointments/availability";

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
  const [startTime, setStartTime] = useState<Dayjs | null>(dayjs());
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = staffServiceOptions.find(
    (s) => s.value === serviceId,
  );
  const selectedServiceDef = serviceDefinitionOptions.find(
    (s) => s.value === serviceDefinitionId,
  );
  const duration = selectedServiceDef?.baseDuration || 30;

  const handleSlotClick = (slot: TimeSlot) => {
    setStartTime(dayjs(slot.startTime));
    // Set the staff service from the clicked slot
    if (slot.staffServiceId) {
      setServiceId(slot.staffServiceId);
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
    setStartTime(dayjs());
    setNotes("");
    onClose();
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
              <TextField
                label="Staff Service"
                value={selectedService?.label || ""}
                placeholder="Select a time slot to choose staff service"
                fullWidth
                required
                InputProps={{
                  readOnly: true,
                }}
                helperText="This will be set when you click on an available time slot"
              />

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

              <DateTimePicker
                label="Start Time"
                value={startTime}
                onChange={(newValue) => setStartTime(newValue)}
                slotProps={{
                  textField: {
                    required: true,
                    fullWidth: true,
                  },
                }}
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
