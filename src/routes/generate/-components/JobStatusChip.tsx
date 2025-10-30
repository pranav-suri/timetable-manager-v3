import { Chip } from "@mui/material";
import type { JobStatus } from "./types";

interface JobStatusChipProps {
  status: JobStatus;
  size?: "small" | "medium";
}

export function JobStatusChip({ status, size = "small" }: JobStatusChipProps) {
  const getStatusColor = (
    statusValue: JobStatus,
  ): "warning" | "info" | "success" | "error" | "default" => {
    switch (statusValue) {
      case "PENDING":
        return "warning";
      case "IN_PROGRESS":
        return "info";
      case "COMPLETED":
        return "success";
      case "FAILED":
        return "error";
      default:
        return "default";
    }
  };

  return <Chip label={status} color={getStatusColor(status)} size={size} />;
}
