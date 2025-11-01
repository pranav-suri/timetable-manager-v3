import {
  Box,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useSlotDaysAndNumbers } from "@/routes/tt/$timetableId/edit/-MuiTimetable";

interface DeprioritizationConfigProps {
  deprioritizedDays?: number[];
  deprioritizedSlotNumbers?: number[];
  deprioritizedDaySlots?: Array<{ day: number; period: number }>;
  onChange: (
    field:
      | "deprioritizedDays"
      | "deprioritizedSlotNumbers"
      | "deprioritizedDaySlots",
    value: number[] | Array<{ day: number; period: number }>,
  ) => void;
  disabled?: boolean;
}

const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

export function DeprioritizationConfig({
  deprioritizedDays = [],
  deprioritizedSlotNumbers = [],
  deprioritizedDaySlots = [],
  onChange,
  disabled = false,
}: DeprioritizationConfigProps) {
  const { slotDays, slotNumbers } = useSlotDaysAndNumbers();
  const [newDaySlot, setNewDaySlot] = useState({ day: 1, period: 1 });

  // Get available days from actual slot data
  const availableDays = useMemo(
    () =>
      slotDays
        .map((s) => s.day)
        .map((day) => ({
          value: day,
          label: WEEKDAYS.find((d) => d.value === day)?.label || `Day ${day}`,
        })),
    [slotDays],
  );

  // Get available slot numbers from actual slot data
  const availableSlotNumbers = useMemo(
    () => slotNumbers.map((s) => s.number),
    [slotNumbers],
  );

  // Initialize newDaySlot with actual data when available
  useEffect(() => {
    const firstDay = availableDays[0];
    const firstPeriod = availableSlotNumbers[0];
    if (firstDay && firstPeriod !== undefined) {
      setNewDaySlot({
        day: firstDay.value,
        period: firstPeriod,
      });
    }
  }, [availableDays, availableSlotNumbers]);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
        Deprioritization Settings
      </Typography>
      <Typography
        variant="caption"
        color="textSecondary"
        sx={{ display: "block", mb: 2 }}
      >
        Configure which days, time slots, or specific combinations should be
        avoided when scheduling. These are soft preferences - lectures can still
        be scheduled here if needed.
      </Typography>

      <Stack spacing={3}>
        {/* Deprioritized Days */}
        <FormControl fullWidth disabled={disabled}>
          <InputLabel>Deprioritized Days</InputLabel>
          <Select
            multiple
            value={deprioritizedDays}
            onChange={(e) => {
              const value = e.target.value;
              onChange(
                "deprioritizedDays",
                typeof value === "string" ? [] : value,
              );
            }}
            input={<OutlinedInput label="Deprioritized Days" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip
                    key={value}
                    label={
                      WEEKDAYS.find((d) => d.value === value)?.label ||
                      `Day ${value}`
                    }
                    size="small"
                  />
                ))}
              </Box>
            )}
          >
            {availableDays.map((day) => (
              <MenuItem key={day.value} value={day.value}>
                {day.label}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
            Select entire days to avoid (e.g., Fridays for half-days)
          </Typography>
        </FormControl>

        {/* Deprioritized Slot Numbers */}
        <FormControl fullWidth disabled={disabled}>
          <InputLabel>Deprioritized Time Slots</InputLabel>
          <Select
            multiple
            value={deprioritizedSlotNumbers}
            onChange={(e) => {
              const value = e.target.value;
              onChange(
                "deprioritizedSlotNumbers",
                typeof value === "string" ? [] : value,
              );
            }}
            input={<OutlinedInput label="Deprioritized Time Slots" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={`Period ${value}`} size="small" />
                ))}
              </Box>
            )}
          >
            {availableSlotNumbers.map((period) => (
              <MenuItem key={period} value={period}>
                Period {period}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
            Select specific time periods to avoid (e.g., period 1 for early
            morning, period 8+ for late afternoon)
          </Typography>
        </FormControl>

        {/* Deprioritized Day-Slot Combinations */}
        <Box>
          <Typography variant="body2" gutterBottom sx={{ fontWeight: 500 }}>
            Deprioritized Day-Slot Combinations
          </Typography>
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ display: "block", mb: 1 }}
          >
            Avoid specific day+time combinations (e.g., Friday afternoon, Monday
            morning)
          </Typography>

          {/* Existing combinations */}
          <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
            {deprioritizedDaySlots.length === 0 ? (
              <Typography variant="caption" color="textSecondary">
                No specific combinations set. Use the form below to add them.
              </Typography>
            ) : (
              deprioritizedDaySlots.map((combo, index) => (
                <Chip
                  key={index}
                  label={`${WEEKDAYS.find((d) => d.value === combo.day)?.label || `Day ${combo.day}`} - Period ${combo.period}`}
                  onDelete={
                    disabled
                      ? undefined
                      : () => {
                          onChange(
                            "deprioritizedDaySlots",
                            deprioritizedDaySlots.filter((_, i) => i !== index),
                          );
                        }
                  }
                  deleteIcon={<DeleteIcon />}
                />
              ))
            )}
          </Box>

          {/* Add new combination */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
            <FormControl
              sx={{ minWidth: 150 }}
              size="small"
              disabled={disabled}
            >
              <InputLabel>Day</InputLabel>
              <Select
                value={newDaySlot.day}
                label="Day"
                onChange={(e) =>
                  setNewDaySlot({ ...newDaySlot, day: Number(e.target.value) })
                }
              >
                {availableDays.map((day) => (
                  <MenuItem key={day.value} value={day.value}>
                    {day.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              sx={{ minWidth: 120 }}
              size="small"
              disabled={disabled}
            >
              <InputLabel>Period</InputLabel>
              <Select
                value={newDaySlot.period}
                label="Period"
                onChange={(e) =>
                  setNewDaySlot({
                    ...newDaySlot,
                    period: Number(e.target.value),
                  })
                }
              >
                {availableSlotNumbers.map((period) => (
                  <MenuItem key={period} value={period}>
                    Period {period}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <IconButton
              color="primary"
              onClick={() => {
                // Check if combination already exists
                const exists = deprioritizedDaySlots.some(
                  (combo) =>
                    combo.day === newDaySlot.day &&
                    combo.period === newDaySlot.period,
                );
                if (!exists) {
                  onChange("deprioritizedDaySlots", [
                    ...deprioritizedDaySlots,
                    newDaySlot,
                  ]);
                }
              }}
              disabled={disabled}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}
