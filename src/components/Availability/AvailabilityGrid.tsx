/**
 * AvailabilityGrid Component
 *
 * A reusable grid component for managing unavailability constraints.
 * Displays a calendar-style grid where users can mark slots as:
 * - Hard unavailable (cannot schedule) - Red theme
 * - Preferred unavailable (try to avoid) - Orange/yellow theme
 *
 * Used by TeacherUnavailableEditor, ClassroomUnavailableEditor, and SubdivisionUnavailableEditor.
 */

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Stack,
  alpha,
  Alert,
  AlertTitle,
  useTheme,
} from "@mui/material";
import { useMemo } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// Day names for column headers
const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export interface Slot {
  id: string;
  day: number; // 0-6 (0=Monday)
  number: number; // Period number (e.g., 1, 2, 3...)
  timetableId: string;
}

export interface UnavailableSlot {
  id: string;
  slotId: string;
  isPreferred: boolean;
}

export interface AvailabilityGridProps {
  /** All available slots in the timetable */
  slots: Slot[];
  /** Currently marked unavailable slots */
  unavailableSlots: UnavailableSlot[];
  /** Callback when a new unavailable slot is added */
  onAdd: (slotId: string, isPreferred: boolean) => void;
  /** Callback when an unavailable slot's preference is updated */
  onUpdate: (id: string, isPreferred: boolean) => void;
  /** Callback when an unavailable slot is removed */
  onDelete: (id: string) => void;
  /** If true, grid is read-only */
  readonly?: boolean;
}

export function AvailabilityGrid({
  slots,
  unavailableSlots,
  onAdd,
  onUpdate,
  onDelete,
  readonly = false,
}: AvailabilityGridProps) {
  const theme = useTheme();

  // Group slots by day and period
  const gridData = useMemo(() => {
    // Find unique days and periods
    const days = Array.from(new Set(slots.map((s) => s.day))).sort(
      (a, b) => a - b,
    );
    const periods = Array.from(new Set(slots.map((s) => s.number))).sort(
      (a, b) => a - b,
    );

    // Create a map for quick lookup: "day-period" -> slot
    const slotMap = new Map<string, Slot>();
    slots.forEach((slot) => {
      slotMap.set(`${slot.day}-${slot.number}`, slot);
    });

    // Create a map for unavailable slots: slotId -> UnavailableSlot
    const unavailableMap = new Map<string, UnavailableSlot>();
    unavailableSlots.forEach((us) => {
      unavailableMap.set(us.slotId, us);
    });

    return { days, periods, slotMap, unavailableMap };
  }, [slots, unavailableSlots]);

  // Handler for 3-state click cycle: Available -> Hard -> Preferred -> Available
  const handleCellClick = (
    slotId: string,
    currentUnavailable: UnavailableSlot | undefined,
  ) => {
    if (readonly) return;

    if (currentUnavailable) {
      if (currentUnavailable.isPreferred) {
        // Was Preferred -> cycle to Available (Delete)
        onDelete(currentUnavailable.id);
      } else {
        // Was Hard -> cycle to Preferred (Update)
        onUpdate(currentUnavailable.id, true);
      }
    } else {
      // Was Available -> cycle to Hard (Add)
      // Default to Hard (most restrictive) as the safest default
      onAdd(slotId, false);
    }
  };

  const getCellColor = (unavailable: UnavailableSlot | undefined) => {
    if (!unavailable) return undefined;

    const isDark = theme.palette.mode === "dark";
    // Use higher alpha in dark mode for better visibility
    const alphaValue = isDark ? 0.4 : 0.2;

    return unavailable.isPreferred
      ? alpha(theme.palette.warning.main, alphaValue) // Orange for preferred
      : alpha(theme.palette.error.main, alphaValue); // Red for hard
  };

  // Get emoji icon for cell state
  const getCellIcon = (unavailable: UnavailableSlot | undefined) => {
    if (!unavailable) return "";
    return unavailable.isPreferred ? "⚠️" : "❌";
  };

  // Calculate summary stats
  const hardCount = unavailableSlots.filter((u) => !u.isPreferred).length;
  const preferredCount = unavailableSlots.filter((u) => u.isPreferred).length;
  if (gridData.days.length === 0 || gridData.periods.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">
          No slots available. Please create slots for this timetable first.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Info Alert */}
      <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2 }}>
        <AlertTitle>How to Use</AlertTitle>
        <Typography variant="body2">
          <strong>Click a cell</strong> to cycle its availability:
          <br />• 1st Click: <strong>Available</strong> → <strong>Hard</strong>{" "}
          (Cannot schedule)
          <br />• 2nd Click: <strong>Hard</strong> → <strong>Preferred</strong>{" "}
          (Try to avoid)
          <br />• 3rd Click: <strong>Preferred</strong> →{" "}
          <strong>Available</strong> (No constraint)
        </Typography>
      </Alert>

      {/* Legend */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Chip
          label={`❌ Hard: ${hardCount}`}
          sx={{
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.error.main, 0.3)
                : alpha(theme.palette.error.main, 0.15),
            color:
              theme.palette.mode === "dark"
                ? theme.palette.error.light
                : theme.palette.error.dark,
            fontWeight: 500,
          }}
        />
        <Chip
          label={`⚠️ Preferred: ${preferredCount}`}
          sx={{
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.warning.main, 0.3)
                : alpha(theme.palette.warning.main, 0.15),
            color:
              theme.palette.mode === "dark"
                ? theme.palette.warning.light
                : theme.palette.warning.dark,
            fontWeight: 500,
          }}
        />
        <Typography variant="caption" color="text.secondary">
          Total: {hardCount + preferredCount} unavailable slots
        </Typography>
      </Stack>

      <TableContainer component={Paper} elevation={2}>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 600,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.primary.main, 0.08),
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.primary.light
                      : theme.palette.primary.dark,
                  position: "sticky",
                  left: 0,
                  zIndex: 1,
                }}
              >
                Period
              </TableCell>
              {gridData.days.map((day) => (
                <TableCell
                  key={day}
                  align="center"
                  sx={{
                    fontWeight: 600,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.primary.main, 0.15)
                        : alpha(theme.palette.primary.main, 0.08),
                    color:
                      theme.palette.mode === "dark"
                        ? theme.palette.primary.light
                        : theme.palette.primary.dark,
                  }}
                >
                  {DAY_NAMES[day - 1]}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {gridData.periods.map((period) => (
              <TableRow key={period}>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{
                    fontWeight: 500,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.background.default, 0.5)
                        : alpha(theme.palette.primary.main, 0.03),
                    color: "text.primary",
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                  }}
                >
                  Period {period}
                </TableCell>
                {gridData.days.map((day) => {
                  const slot = gridData.slotMap.get(`${day}-${period}`);
                  if (!slot) {
                    return (
                      <TableCell
                        key={day}
                        sx={{
                          bgcolor:
                            theme.palette.mode === "dark"
                              ? alpha(theme.palette.background.default, 0.3)
                              : alpha(theme.palette.action.disabled, 0.05),
                        }}
                      />
                    );
                  }

                  const unavailable = gridData.unavailableMap.get(slot.id);

                  return (
                    <TableCell
                      key={day}
                      align="center"
                      onClick={() => handleCellClick(slot.id, unavailable)}
                      sx={{
                        bgcolor: getCellColor(unavailable),
                        p: 2,
                        minHeight: 60,
                        cursor: readonly ? "default" : "pointer",
                        userSelect: "none",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          bgcolor: readonly
                            ? getCellColor(unavailable)
                            : unavailable
                              ? getCellColor(unavailable)
                              : alpha(theme.palette.action.hover, 0.08),
                          transform: readonly ? "none" : "scale(1.02)",
                        },
                      }}
                    >
                      <Typography variant="h6" sx={{ userSelect: "none" }}>
                        {getCellIcon(unavailable)}
                      </Typography>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
