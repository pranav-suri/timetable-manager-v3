import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Collapse,
  IconButton,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Link } from "@tanstack/react-router";
import type { UseQueryResult } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

interface Job {
  id: string;
  status: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  error?: string | null;
}

interface JobStatusData {
  id: string;
  status: string;
  progress: number;
  error: string | null;
  result: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface GenerationResultsProps {
  job: Job;
  useJobStatus: (jobId: string) => UseQueryResult<JobStatusData, Error>;
  timetableId: string;
}

export function GenerationResults({
  job,
  useJobStatus,
  timetableId,
}: GenerationResultsProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: statusData } = useJobStatus(job.id);
  const queryClient = useQueryClient();
  const previousStatusRef = useRef<string | null>(null);

  const currentStatus = statusData?.status || job.status;
  const currentError = statusData?.error || job.error;

  // Invalidate collections when job completes
  useEffect(() => {
    // Check if status changed to COMPLETED
    if (
      currentStatus === "COMPLETED" &&
      previousStatusRef.current !== "COMPLETED"
    ) {
      // Invalidate lectureSlot and lectureClassroom collections to trigger refresh
      // TODO: See how invalidateQuery works
      queryClient.invalidateQueries({
        queryKey: ["lectureSlot", timetableId],
      });
      queryClient.invalidateQueries({
        queryKey: ["lectureClassroom", timetableId],
      });

      console.log(
        `Collections invalidated for timetable ${timetableId} after job ${job.id} completion`,
      );
    }
    previousStatusRef.current = currentStatus;
  }, [currentStatus, timetableId, job.id, queryClient]);

  // Parse result JSON if available
  let result:
    | {
        assignments?: Array<any>;
        stats?: {
          completionRate?: number;
          totalLectures?: number;
          assignedLectures?: number;
          hardViolations?: number;
          softViolations?: number;
          bestFitness?: number;
          generationsCompleted?: number;
        };
        qualityReport?: {
          roomUtilization?: number;
          teacherLoadBalance?: number;
          overallQuality?: string;
        };
      }
    | undefined;

  if (statusData?.result) {
    try {
      result = JSON.parse(statusData.result);
    } catch {
      // Ignore parse errors
    }
  }

  const isCompleted = currentStatus === "COMPLETED";
  const isFailed = currentStatus === "FAILED";

  const getStatusColor = () => {
    if (isCompleted) return "success";
    if (isFailed) return "error";
    return "default";
  };

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircleIcon />;
    if (isFailed) return <ErrorIcon />;
    return <WarningIcon />;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Paper sx={{ p: 2, border: 1, borderColor: "divider" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getStatusIcon()}
          <Typography variant="subtitle1">Job {job.id}</Typography>
          <Chip
            label={currentStatus}
            color={getStatusColor()}
            size="small"
            variant="outlined"
          />
        </Box>

        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s",
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      {/* Basic Info */}
      <Typography variant="body2" color="textSecondary">
        Created: {formatDate(job.createdAt)}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Completed: {formatDate(job.updatedAt)}
      </Typography>

      {/* Quick Stats for Completed Jobs */}
      {isCompleted && result?.stats && (
        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {result.stats.completionRate !== undefined && (
            <Chip
              label={`${result.stats.completionRate.toFixed(1)}% Complete`}
              color={
                result.stats.completionRate === 100 ? "success" : "warning"
              }
              size="small"
            />
          )}
          {result.stats.hardViolations !== undefined && (
            <Chip
              label={`${result.stats.hardViolations} Hard Violations`}
              color={result.stats.hardViolations === 0 ? "success" : "error"}
              size="small"
            />
          )}
          {result.stats.softViolations !== undefined && (
            <Chip
              label={`${result.stats.softViolations} Soft Violations`}
              color={result.stats.softViolations === 0 ? "success" : "warning"}
              size="small"
            />
          )}
        </Box>
      )}

      {/* Error Display */}
      {currentError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="body2">{currentError}</Typography>
        </Alert>
      )}

      {/* Expanded Details */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
          {/* Detailed Stats */}
          {result?.stats && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Generation Statistics
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 1 }}>
                {result.stats.totalLectures !== undefined && (
                  <Paper sx={{ p: 1.5, flex: "1 1 150px" }}>
                    <Typography variant="caption" color="textSecondary">
                      Total Lectures
                    </Typography>
                    <Typography variant="h6">
                      {result.stats.totalLectures}
                    </Typography>
                  </Paper>
                )}

                {result.stats.assignedLectures !== undefined && (
                  <Paper sx={{ p: 1.5, flex: "1 1 150px" }}>
                    <Typography variant="caption" color="textSecondary">
                      Assigned
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {result.stats.assignedLectures}
                    </Typography>
                  </Paper>
                )}

                {result.stats.bestFitness !== undefined && (
                  <Paper sx={{ p: 1.5, flex: "1 1 150px" }}>
                    <Typography variant="caption" color="textSecondary">
                      Best Fitness
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {(result.stats.bestFitness * 100).toFixed(1)}%
                    </Typography>
                  </Paper>
                )}

                {result.stats.generationsCompleted !== undefined && (
                  <Paper sx={{ p: 1.5, flex: "1 1 150px" }}>
                    <Typography variant="caption" color="textSecondary">
                      Generations
                    </Typography>
                    <Typography variant="h6">
                      {result.stats.generationsCompleted}
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          )}

          {/* Quality Report */}
          {result?.qualityReport && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Quality Metrics
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 1 }}>
                {result.qualityReport.roomUtilization !== undefined && (
                  <Paper sx={{ p: 1.5, flex: "1 1 150px" }}>
                    <Typography variant="caption" color="textSecondary">
                      Room Utilization
                    </Typography>
                    <Typography variant="h6">
                      {(result.qualityReport.roomUtilization * 100).toFixed(1)}%
                    </Typography>
                  </Paper>
                )}

                {result.qualityReport.teacherLoadBalance !== undefined && (
                  <Paper sx={{ p: 1.5, flex: "1 1 150px" }}>
                    <Typography variant="caption" color="textSecondary">
                      Load Balance
                    </Typography>
                    <Typography variant="h6">
                      {result.qualityReport.teacherLoadBalance.toFixed(2)}
                    </Typography>
                  </Paper>
                )}

                {result.qualityReport.overallQuality && (
                  <Paper sx={{ p: 1.5, flex: "1 1 150px" }}>
                    <Typography variant="caption" color="textSecondary">
                      Overall Grade
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {result.qualityReport.overallQuality}
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          )}

          {/* View Timetable Button */}
          {isCompleted && (
            <Box>
              <Link to="/tt/$timetableId/edit" params={{ timetableId }}>
                <Button
                  variant="contained"
                  startIcon={<VisibilityIcon />}
                  fullWidth
                >
                  View & Edit Generated Timetable
                </Button>
              </Link>
            </Box>
          )}

          {/* Retry Guidance */}
          {isFailed && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                If the generation failed due to insufficient data or invalid
                constraints, please review your timetable configuration and try
                again.
              </Typography>
            </Alert>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
