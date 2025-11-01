import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import TimerIcon from "@mui/icons-material/Timer";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import type { UseQueryResult } from "@tanstack/react-query";

interface Job {
  id: string;
  status: string;
  progress: number;
  createdAt: Date;
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

interface GenerationProgressProps {
  job: Job;
  useJobStatus: (jobId: string) => UseQueryResult<JobStatusData, Error>;
  onCancel: (jobId: string) => void;
  isCancelling: boolean;
}

export function GenerationProgress({
  job,
  useJobStatus,
  onCancel,
  isCancelling,
}: GenerationProgressProps) {
  const { data: statusData } = useJobStatus(job.id);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Calculate elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(job.createdAt).getTime();
      setElapsedTime(Math.floor(elapsed / 1000)); // Convert to seconds
    }, 1000);

    return () => clearInterval(interval);
  }, [job.createdAt]);

  const currentProgress = statusData?.progress ?? job.progress;

  // Parse result JSON if available
  let metadata:
    | {
        currentGeneration?: number;
        maxGenerations?: number;
        bestFitness?: number;
        avgFitness?: number;
        hardViolations?: number;
        softViolations?: number;
      }
    | undefined;

  if (statusData?.result) {
    try {
      const parsedResult = JSON.parse(statusData.result);
      metadata = parsedResult.metadata;
    } catch {
      // Ignore parse errors
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Estimate time remaining
  const estimateTimeRemaining = () => {
    if (currentProgress <= 0) return "Calculating...";
    const totalEstimatedTime = (elapsedTime / currentProgress) * 100;
    const remaining = Math.floor(totalEstimatedTime - elapsedTime);
    return formatTime(Math.max(0, remaining));
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">Generation in Progress</Typography>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<CancelIcon />}
          onClick={() => onCancel(job.id)}
          disabled={isCancelling}
        >
          {isCancelling ? "Cancelling..." : "Cancel"}
        </Button>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {metadata?.currentGeneration !== undefined
              ? `Generation ${metadata.currentGeneration} / ${metadata.maxGenerations}`
              : "Initializing..."}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {currentProgress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={currentProgress}
          sx={{ height: 10, borderRadius: 1 }}
        />
      </Box>

      {/* Statistics Grid */}
      {metadata && (
        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
          {/* Elapsed Time */}
          <Paper
            sx={{
              p: 2,
              flex: "1 1 150px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <TimerIcon fontSize="small" color="action" />
              <Typography variant="caption" color="textSecondary">
                Elapsed
              </Typography>
            </Box>
            <Typography variant="h6">{formatTime(elapsedTime)}</Typography>
          </Paper>

          {/* Estimated Remaining */}
          <Paper
            sx={{
              p: 2,
              flex: "1 1 150px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <TimerIcon fontSize="small" color="action" />
              <Typography variant="caption" color="textSecondary">
                Remaining
              </Typography>
            </Box>
            <Typography variant="h6">{estimateTimeRemaining()}</Typography>
          </Paper>

          {/* Best Fitness */}
          {metadata.bestFitness !== undefined && (
            <Paper
              sx={{
                p: 2,
                flex: "1 1 150px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <TrendingUpIcon fontSize="small" color="success" />
                <Typography variant="caption" color="textSecondary">
                  Best Fitness
                </Typography>
              </Box>
              <Typography variant="h6" color="success.main">
                {(metadata.bestFitness * 100).toFixed(1)}%
              </Typography>
            </Paper>
          )}

          {/* Average Fitness */}
          {metadata.avgFitness !== undefined && (
            <Paper
              sx={{
                p: 2,
                flex: "1 1 150px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <TrendingUpIcon fontSize="small" color="action" />
                <Typography variant="caption" color="textSecondary">
                  Avg Fitness
                </Typography>
              </Box>
              <Typography variant="h6">
                {(metadata.avgFitness * 100).toFixed(1)}%
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Violations Display */}
      {metadata &&
        (metadata.hardViolations !== undefined ||
          metadata.softViolations !== undefined) && (
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {metadata.hardViolations !== undefined && (
              <Chip
                label={`Hard Violations: ${metadata.hardViolations}`}
                color={metadata.hardViolations === 0 ? "success" : "error"}
                variant="outlined"
              />
            )}
            {metadata.softViolations !== undefined && (
              <Chip
                label={`Soft Violations: ${metadata.softViolations}`}
                color={metadata.softViolations === 0 ? "success" : "warning"}
                variant="outlined"
              />
            )}
          </Box>
        )}

      {/* Status Message */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="textSecondary">
          The genetic algorithm is evolving a timetable solution. This process
          may take several minutes depending on the complexity of your
          constraints.
        </Typography>
      </Box>
    </Box>
  );
}
