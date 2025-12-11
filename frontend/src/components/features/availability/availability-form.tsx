import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  Typography,
  Alert,
} from "@mui/material";
import { TimeField } from "@mui/x-date-pickers/TimeField";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import dayjs from "dayjs";
import {
  BulkSetAvailabilitySchema,
  type BulkSetAvailabilityBody,
  type AvailabilityResponse,
} from "@ps-design/schemas/appointments/availability";
import { DayOfWeekLiteral } from "@ps-design/schemas/appointments/availability/shared";

interface Slot {
  id: string;
  dayOfWeek: keyof typeof DayOfWeekLiteral;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
}

interface AvailabilityFormProps {
  initialData?: AvailabilityResponse[];
  onSubmit: (data: BulkSetAvailabilityBody) => void;
  isPending: boolean;
}

const DAYS = Object.values(DayOfWeekLiteral);

export const AvailabilityForm: React.FC<AvailabilityFormProps> = ({
  initialData,
  onSubmit,
  isPending,
}) => {
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    if (initialData) {
      setSlots(
        initialData.map((item, idx) => ({
          id: `${item.dayOfWeek}-${idx}`,
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime.slice(0, 5),
          endTime: item.endTime.slice(0, 5),
          isOvernight: item.isOvernight,
        })),
      );
    }
  }, [initialData]);

  const handleAddSlot = (day: keyof typeof DayOfWeekLiteral) => {
    const newSlot: Slot = {
      id: `${day}-${Date.now()}`,
      dayOfWeek: day,
      startTime: "09:00",
      endTime: "17:00",
      isOvernight: false,
    };
    setSlots((prev) => [...prev, newSlot]);
  };

  const handleRemoveSlot = (id: string) => {
    setSlots((prev) => prev.filter((slot) => slot.id !== id));
  };

  const handleUpdateSlot = (
    id: string,
    field: keyof Slot,
    value: string | boolean,
  ) => {
    setSlots((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, [field]: value } : slot)),
    );
  };

  const availabilities = useMemo(
    () =>
      slots.map((slot) => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isOvernight: slot.isOvernight,
      })),
    [slots],
  );

  const validation = useMemo(
    () => BulkSetAvailabilitySchema.safeParse({ availabilities }),
    [availabilities],
  );

  const errors = useMemo(() => {
    const newErrors: Record<string, string> = {};

    if (validation.success) {
      return newErrors;
    }

    validation.error.issues.forEach((issue) => {
      // Expected path: ['availabilities', index, field?]
      if (issue.path.length >= 2 && issue.path[0] === "availabilities") {
        const index = issue.path[1] as number;
        const field = issue.path[2] as string | undefined;
        const slotId = slots[index]?.id;

        if (!slotId) {
          return;
        }

        if (field) {
          newErrors[`${slotId}-${field}`] = issue.message;
        } else {
          newErrors[`${slotId}-general`] = issue.message;
        }

        return;
      }

      if (issue.path.length === 1 && issue.path[0] === "availabilities") {
        newErrors["global"] = issue.message;
      }
    });

    return newErrors;
  }, [slots, validation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.success) {
      return;
    }

    onSubmit(validation.data);
  };

  const slotsByDay = useMemo(
    () =>
      DAYS.reduce(
        (acc, day) => {
          acc[day] = slots.filter((slot) => slot.dayOfWeek === day);
          return acc;
        },
        {} as Record<string, Slot[]>,
      ),
    [slots],
  );

  // Check for validation errors
  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  // Get all error messages for display at top
  const errorMessages = useMemo(() => {
    const messages: string[] = [];
    Object.values(errors).forEach((msg) => {
      if (msg && !messages.includes(msg)) {
        messages.push(msg);
      }
    });
    return messages;
  }, [errors]);

  return (
    <form onSubmit={handleSubmit}>
      {hasErrors && errorMessages.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Please fix the following errors:
          </Typography>
          <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem" }}>
            {errorMessages.map((msg) => (
              <li key={msg}>
                <Typography variant="body2">{msg}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}
      <Stack spacing={3}>
        {DAYS.map((day) => {
          const daySlots = slotsByDay[day] || [];
          const dayHasErrors = daySlots.some(
            (slot) =>
              errors[`${slot.id}-startTime`] ||
              errors[`${slot.id}-endTime`] ||
              errors[`${slot.id}-general`],
          );

          return (
            <Card
              key={day}
              variant="outlined"
              sx={
                dayHasErrors
                  ? { borderColor: "error.main", borderWidth: 2 }
                  : {}
              }
            >
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">{day}</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    size="small"
                    onClick={() => handleAddSlot(day)}
                  >
                    Add Slot
                  </Button>
                </Stack>

                {slotsByDay[day]?.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No availability set for this day.
                  </Typography>
                )}

                <Stack spacing={2}>
                  {slotsByDay[day]?.map((slot) => (
                    <Stack
                      key={slot.id}
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      alignItems="center"
                    >
                      <Box sx={{ flex: 1 }}>
                        <TimeField
                          label="Start Time"
                          value={
                            slot.startTime
                              ? dayjs(`2000-01-01 ${slot.startTime}`)
                              : null
                          }
                          onChange={(newValue) => {
                            handleUpdateSlot(
                              slot.id,
                              "startTime",
                              newValue ? newValue.format("HH:mm") : "",
                            );
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              error: !!errors[`${slot.id}-startTime`],
                              helperText: errors[`${slot.id}-startTime`],
                            },
                          }}
                          format="HH:mm"
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <TimeField
                          label="End Time"
                          value={
                            slot.endTime
                              ? dayjs(`2000-01-01 ${slot.endTime}`)
                              : null
                          }
                          onChange={(newValue) => {
                            handleUpdateSlot(
                              slot.id,
                              "endTime",
                              newValue ? newValue.format("HH:mm") : "",
                            );
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              error: !!errors[`${slot.id}-endTime`],
                              helperText: errors[`${slot.id}-endTime`],
                            },
                          }}
                          format="HH:mm"
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={slot.isOvernight}
                              onChange={(e) => {
                                handleUpdateSlot(
                                  slot.id,
                                  "isOvernight",
                                  e.target.checked,
                                );
                              }}
                            />
                          }
                          label="Overnight"
                        />
                      </Box>
                      <Box>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveSlot(slot.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Stack>
                  ))}
                  {/* Show general errors for this day's slots (like overlaps) */}
                  {slotsByDay[day]?.map(
                    (slot) =>
                      errors[`${slot.id}-general`] && (
                        <Alert
                          severity="error"
                          key={`${slot.id}-general-error`}
                          sx={{ mt: 1 }}
                        >
                          {errors[`${slot.id}-general`]}
                        </Alert>
                      ),
                  )}
                </Stack>
              </CardContent>
            </Card>
          );
        })}

        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
        >
          <Typography
            variant="body2"
            color="error"
            sx={{ alignSelf: "center", display: hasErrors ? "block" : "none" }}
          >
            Please fix validation errors before saving
          </Typography>
          <Button
            type="submit"
            variant="contained"
            disabled={isPending || hasErrors}
          >
            {isPending ? "Saving..." : "Save Availability"}
          </Button>
        </Box>
      </Stack>
    </form>
  );
};
