import { useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import { useAvailableTimeSlots } from "@/hooks/appointments";
import type { TimeSlot } from "@ps-design/schemas/appointments/availability";

interface AvailabilityTimetableProps {
  staffServiceId?: string;
  serviceDefinitionId?: string;
  employeeId?: string;
  durationMinutes?: number;
  onSlotClick?: (slot: TimeSlot) => void;
  serviceDefinitionOptions?: Array<{
    label: string;
    value: string;
    baseDuration: number;
  }>;
  onServiceDefinitionChange?: (serviceDefinitionId: string) => void;
}

export const AvailabilityTimetable: React.FC<AvailabilityTimetableProps> = ({
  staffServiceId,
  serviceDefinitionId,
  employeeId,
  durationMinutes = 30,
  onSlotClick,
  serviceDefinitionOptions = [],
  onServiceDefinitionChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [groupBy, setGroupBy] = useState<"time" | "employee">("time");

  const { data, isLoading, error, refetch } = useAvailableTimeSlots({
    staffServiceId,
    serviceDefinitionId,
    employeeId,
    date: selectedDate.toISOString(),
    durationMinutes,
  });

  const groupedSlots = useMemo(() => {
    if (!data?.slots) return {};

    if (groupBy === "time") {
      return data.slots.reduce(
        (acc, slot) => {
          const timeKey = dayjs(slot.startTime).format("HH:mm");
          if (!acc[timeKey]) acc[timeKey] = [];
          acc[timeKey].push(slot);
          return acc;
        },
        {} as Record<string, TimeSlot[]>,
      );
    } else {
      return data.slots.reduce(
        (acc, slot) => {
          const employeeKey = slot.employeeName;
          if (!acc[employeeKey]) acc[employeeKey] = [];
          acc[employeeKey].push(slot);
          return acc;
        },
        {} as Record<string, TimeSlot[]>,
      );
    }
  }, [data?.slots, groupBy]);

  const handlePreviousDay = () => {
    setSelectedDate((prev) => prev.subtract(1, "day"));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => prev.add(1, "day"));
  };

  const handleToday = () => {
    setSelectedDate(dayjs());
  };

  if (error) {
    return (
      <Alert severity="error">
        Failed to load availability. Please try again.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          {/* Header Controls */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">Available Time Slots</Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              {serviceDefinitionOptions.length > 0 && (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Service</InputLabel>
                  <Select
                    value={serviceDefinitionId || ""}
                    label="Service"
                    onChange={(e) =>
                      onServiceDefinitionChange?.(e.target.value)
                    }
                  >
                    <MenuItem value="">
                      <em>All Services</em>
                    </MenuItem>
                    {serviceDefinitionOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Group By</InputLabel>
                <Select
                  value={groupBy}
                  label="Group By"
                  onChange={(e) =>
                    setGroupBy(e.target.value as "time" | "employee")
                  }
                >
                  <MenuItem value="time">Time</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                </Select>
              </FormControl>

              <Tooltip title="Refresh">
                <IconButton onClick={() => refetch()} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Date Navigation */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="center"
          >
            <IconButton onClick={handlePreviousDay} size="small">
              <ChevronLeftIcon />
            </IconButton>

            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={(newValue) => {
                if (newValue) setSelectedDate(newValue);
              }}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { minWidth: 200 },
                },
              }}
            />

            <IconButton onClick={handleNextDay} size="small">
              <ChevronRightIcon />
            </IconButton>

            <Chip
              label="Today"
              onClick={handleToday}
              variant={
                selectedDate.isSame(dayjs(), "day") ? "filled" : "outlined"
              }
              size="small"
              clickable
            />
          </Stack>

          {/* Loading State */}
          {isLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Timetable */}
          {!isLoading && data && (
            <>
              {Object.keys(groupedSlots).length === 0 ? (
                <Alert severity="info">
                  No availability found for the selected date and filters.
                </Alert>
              ) : (
                <Box
                  sx={{
                    maxHeight: 400,
                    overflowY: "auto",
                    pr: 1,
                  }}
                >
                  <Stack spacing={2}>
                    {Object.entries(groupedSlots).map(([key, slots]) => (
                      <Box key={key}>
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 1, fontWeight: 600 }}
                        >
                          {groupBy === "time" ? key : key}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          {slots.map((slot, idx) => {
                            const startTime = dayjs(slot.startTime);
                            const endTime = dayjs(slot.endTime);
                            const timeLabel = `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`;

                            return (
                              <Chip
                                key={idx}
                                label={
                                  groupBy === "time"
                                    ? slot.employeeName
                                    : timeLabel
                                }
                                color={slot.isAvailable ? "success" : "default"}
                                variant={
                                  slot.isAvailable ? "filled" : "outlined"
                                }
                                onClick={
                                  slot.isAvailable && onSlotClick
                                    ? () => onSlotClick(slot)
                                    : undefined
                                }
                                clickable={slot.isAvailable}
                                sx={{
                                  minWidth: 120,
                                  justifyContent: "space-between",
                                  cursor: slot.isAvailable
                                    ? "pointer"
                                    : "not-allowed",
                                  opacity: slot.isAvailable ? 1 : 0.6,
                                }}
                                deleteIcon={
                                  !slot.isAvailable ? (
                                    <Box
                                      component="span"
                                      sx={{
                                        fontSize: "0.75rem",
                                        color: "text.secondary",
                                      }}
                                    >
                                      Booked
                                    </Box>
                                  ) : undefined
                                }
                                onDelete={
                                  !slot.isAvailable ? () => {} : undefined
                                }
                              />
                            );
                          })}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </>
          )}

          {/* Legend */}
          <Stack direction="row" spacing={2} justifyContent="center">
            <Chip
              label="Available"
              color="success"
              size="small"
              variant="filled"
            />
            <Chip label="Occupied" size="small" variant="outlined" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
