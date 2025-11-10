/**
 * UnavailabilityIndicator Component
 *
 * Shows visual indicators for hard and preferred unavailability in timetable cells.
 * Displays tooltips with details about which entities are unavailable.
 */

import { Box, Tooltip, alpha } from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { SlotUnavailability } from "../-hooks/-useSlotUnavailability";

interface UnavailabilityIndicatorProps {
  unavailability: SlotUnavailability;
}

export function UnavailabilityIndicator({
  unavailability,
}: UnavailabilityIndicatorProps) {
  const {
    hasHardUnavailability,
    hasPreferredUnavailability,
    unavailabilityDetails,
  } = unavailability;

  if (!hasHardUnavailability && !hasPreferredUnavailability) {
    return null;
  }

  // Build tooltip content
  const buildTooltipContent = () => {
    const lines: string[] = [];

    const hardTeachers = unavailabilityDetails.teachers.filter(
      (t) => !t.isPreferred,
    );
    const prefTeachers = unavailabilityDetails.teachers.filter(
      (t) => t.isPreferred,
    );
    const hardClassrooms = unavailabilityDetails.classrooms.filter(
      (c) => !c.isPreferred,
    );
    const prefClassrooms = unavailabilityDetails.classrooms.filter(
      (c) => c.isPreferred,
    );
    const hardSubdivisions = unavailabilityDetails.subdivisions.filter(
      (s) => !s.isPreferred,
    );
    const prefSubdivisions = unavailabilityDetails.subdivisions.filter(
      (s) => s.isPreferred,
    );

    if (hardTeachers.length > 0) {
      lines.push(
        `❌ Hard Unavailable Teachers: ${hardTeachers.map((t) => t.name).join(", ")}`,
      );
    }
    if (hardClassrooms.length > 0) {
      lines.push(
        `❌ Hard Unavailable Classrooms: ${hardClassrooms.map((c) => c.name).join(", ")}`,
      );
    }
    if (hardSubdivisions.length > 0) {
      lines.push(
        `❌ Hard Unavailable Groups: ${hardSubdivisions.map((s) => s.name).join(", ")}`,
      );
    }
    if (prefTeachers.length > 0) {
      lines.push(
        `⚠️ Preferred Unavailable Teachers: ${prefTeachers.map((t) => t.name).join(", ")}`,
      );
    }
    if (prefClassrooms.length > 0) {
      lines.push(
        `⚠️ Preferred Unavailable Classrooms: ${prefClassrooms.map((c) => c.name).join(", ")}`,
      );
    }
    if (prefSubdivisions.length > 0) {
      lines.push(
        `⚠️ Preferred Unavailable Groups: ${prefSubdivisions.map((s) => s.name).join(", ")}`,
      );
    }

    return lines.join("\n");
  };

  const tooltipContent = buildTooltipContent();

  return (
    <Tooltip
      title={
        <Box sx={{ whiteSpace: "pre-line", fontSize: "0.75rem" }}>
          {tooltipContent}
        </Box>
      }
      placement="top"
      arrow
    >
      <Box
        sx={{
          position: "absolute",
          top: 4,
          right: 4,
          display: "flex",
          gap: 0.5,
          zIndex: 10,
          pointerEvents: "auto",
        }}
      >
        {hasHardUnavailability && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              borderRadius: "50%",
              bgcolor: alpha("#f44336", 0.9),
              color: "white",
              boxShadow: 1,
            }}
          >
            <BlockIcon sx={{ fontSize: 14 }} />
          </Box>
        )}
        {hasPreferredUnavailability && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              borderRadius: "50%",
              bgcolor: alpha("#ff9800", 0.9),
              color: "white",
              boxShadow: 1,
            }}
          >
            <WarningAmberIcon sx={{ fontSize: 14 }} />
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}
