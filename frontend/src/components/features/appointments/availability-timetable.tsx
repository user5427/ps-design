import { useMemo, useState } from "react";
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { type Dayjs } from "dayjs";
import { useAvailabilityBlocks } from "@/hooks/appointments";
import type { AvailabilityBlock } from "@ps-design/schemas/appointments/availability";

export type AppointmentTimeSelection = {
  startTime: string;
  endTime: string;
  employeeId: string;
  employeeName: string;
  staffServiceId: string;
};

interface AvailabilityTimetableProps {
  staffServiceId?: string;
  serviceDefinitionId?: string;
  employeeId?: string;
  durationMinutes?: number;
  onSlotClick?: (data: AppointmentTimeSelection) => void;
  serviceDefinitionOptions?: Array<{
    label: string;
    value: string;
    duration: number;
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
  const [groupBy, setGroupBy] = useState<"time" | "employee">("employee");
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<AvailabilityBlock | null>(
    null,
  );
  const [selectedTime, setSelectedTime] = useState<Dayjs | null>(null);
  const [timePickerError, setTimePickerError] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useAvailabilityBlocks({
    staffServiceId,
    serviceDefinitionId,
    employeeId,
    date: selectedDate.toISOString(),
  });

  const groupedBlocks = useMemo(() => {
    if (!data?.blocks) return {};

    if (groupBy === "employee") {
      const grouped = data.blocks.reduce(
        (acc, block) => {
          const employeeKey = block.employeeName;
          if (!acc[employeeKey]) acc[employeeKey] = [];
          acc[employeeKey].push(block);
          return acc;
        },
        {} as Record<string, AvailabilityBlock[]>,
      );

      for (const blocks of Object.values(grouped)) {
        blocks.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );
      }

      return grouped;
    } else {
      // Group by time range
      const grouped = data.blocks.reduce(
        (acc, block) => {
          const timeKey = `${dayjs(block.startTime).format("HH:mm")} - ${dayjs(block.endTime).format("HH:mm")}`;
          if (!acc[timeKey]) acc[timeKey] = [];
          acc[timeKey].push(block);
          return acc;
        },
        {} as Record<string, AvailabilityBlock[]>,
      );

      for (const blocks of Object.values(grouped)) {
        blocks.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );
      }

      return grouped;
    }
  }, [data?.blocks, groupBy]);

  const handleBlockClick = (block: AvailabilityBlock) => {
    if (block.type === "FREE") {
      setSelectedBlock(block);
      setSelectedTime(dayjs(block.startTime));
      setTimePickerError(null);
      setTimePickerOpen(true);
    }
  };

  const closeTimePicker = () => {
    setTimePickerOpen(false);
    setSelectedBlock(null);
    setSelectedTime(null);
    setTimePickerError(null);
  };

  const handleTimeSelect = () => {
    if (!selectedBlock || !selectedTime) return;

    const blockStart = dayjs(selectedBlock.startTime);
    const blockEnd = dayjs(selectedBlock.endTime);
    const startTime = selectedTime;
    const endTime = startTime.add(durationMinutes, "minute");

    // Validate time is within the block
    if (startTime.isBefore(blockStart) || endTime.isAfter(blockEnd)) {
      setTimePickerError("Selected time is outside the available block");
      return;
    }

    setTimePickerError(null);

    onSlotClick?.({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      employeeId: selectedBlock.employeeId,
      employeeName: selectedBlock.employeeName,
      staffServiceId: selectedBlock.staffServiceId || "",
    });

    closeTimePicker();
  };

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
            <Typography variant="h6">Available Time Blocks</Typography>

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
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="time">Time</MenuItem>
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

          {/* Timetable - Blocks View */}
          {!isLoading &&
            data &&
            (Object.keys(groupedBlocks).length === 0 ? (
              <Alert severity="info">
                No availability found for the selected date and filters.
              </Alert>
            ) : (
              <Box
                sx={{
                  maxHeight: 500,
                  overflowY: "auto",
                  pr: 1,
                }}
              >
                <Stack spacing={3}>
                  {Object.entries(groupedBlocks)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, blocks]) => (
                      <Box key={key}>
                        <Typography
                          variant="subtitle1"
                          sx={{ mb: 1.5, fontWeight: 600 }}
                        >
                          {key}
                        </Typography>
                        <Stack spacing={1}>
                          {blocks.map((block) => {
                            const startTime = dayjs(block.startTime);
                            const endTime = dayjs(block.endTime);
                            const timeLabel = `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`;
                            const isFree = block.type === "FREE";

                            return (
                              <Box
                                key={block.startTime + block.employeeId}
                                onClick={() => handleBlockClick(block)}
                                sx={{
                                  p: 2,
                                  border: 1,
                                  borderColor: isFree
                                    ? "success.main"
                                    : "grey.300",
                                  borderRadius: 1,
                                  bgcolor: isFree ? "success.50" : "grey.100",
                                  cursor: isFree ? "pointer" : "default",
                                  transition: "all 0.2s",
                                  "&:hover": isFree
                                    ? {
                                        bgcolor: "success.100",
                                        boxShadow: 1,
                                      }
                                    : {},
                                }}
                              >
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="center"
                                >
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    <AccessTimeIcon
                                      fontSize="small"
                                      color={isFree ? "success" : "disabled"}
                                    />
                                    <Typography
                                      variant="body1"
                                      fontWeight={500}
                                    >
                                      {timeLabel}
                                    </Typography>
                                    {groupBy === "time" && (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        • {block.employeeName}
                                      </Typography>
                                    )}
                                  </Stack>
                                  <Chip
                                    label={isFree ? "Available" : "Occupied"}
                                    color={isFree ? "success" : "default"}
                                    size="small"
                                    variant={isFree ? "filled" : "outlined"}
                                  />
                                </Stack>
                                {isFree && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mt: 0.5, display: "block" }}
                                  >
                                    Click to select a specific time
                                  </Typography>
                                )}
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>
                    ))}
                </Stack>
              </Box>
            ))}

          {/* Legend */}
          <Stack direction="row" spacing={2} justifyContent="center">
            <Chip
              label="Available - Click to select time"
              color="success"
              size="small"
              variant="filled"
            />
            <Chip label="Occupied" size="small" variant="outlined" />
          </Stack>
        </Stack>
      </CardContent>

      {/* Time Picker Dialog */}
      <Dialog open={timePickerOpen} onClose={closeTimePicker}>
        <DialogTitle>Select Appointment Time</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
            {selectedBlock && (
              <Alert severity="info">
                Available: {dayjs(selectedBlock.startTime).format("HH:mm")} -{" "}
                {dayjs(selectedBlock.endTime).format("HH:mm")}
                <br />
                Duration: {durationMinutes} minutes
              </Alert>
            )}

            {timePickerError && (
              <Alert severity="error">{timePickerError}</Alert>
            )}

            <TimePicker
              label="Start Time"
              value={selectedTime}
              onChange={(value) => {
                setSelectedTime(value);
                setTimePickerError(null);
              }}
              ampm={false}
              minTime={
                selectedBlock ? dayjs(selectedBlock.startTime) : undefined
              }
              maxTime={
                selectedBlock
                  ? dayjs(selectedBlock.endTime).subtract(
                      durationMinutes,
                      "minute",
                    )
                  : undefined
              }
              minutesStep={5}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
            {selectedTime && (
              <Typography variant="body2" color="text.secondary">
                Appointment: {selectedTime.format("HH:mm")} -{" "}
                {selectedTime.add(durationMinutes, "minute").format("HH:mm")}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTimePicker}>Cancel</Button>
          <Button
            onClick={handleTimeSelect}
            variant="contained"
            disabled={!selectedTime}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
