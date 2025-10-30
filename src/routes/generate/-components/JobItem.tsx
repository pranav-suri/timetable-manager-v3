import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  LinearProgress,
  ListItem,
  Paper,
  Typography,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { JobStatusChip } from "./JobStatusChip";
import type { Job, JobStatus, JobStatusData } from "./types";

interface JobItemProps {
  job: Job;
  statusData?: JobStatusData;
  isLoadingStatus: boolean;
  onCancel: (jobId: string) => void;
  isCancelling: boolean;
}

export function JobItem({
  job,
  statusData,
  isLoadingStatus,
  onCancel,
  isCancelling,
}: JobItemProps) {
  const [expanded, setExpanded] = useState(false);

  const currentStatus = (statusData?.status || job.status) as JobStatus;
  const progress = statusData?.progress || job.progress;
  const error = statusData?.error || job.error;
  const result = statusData?.result;

  const isActive =
    currentStatus === "IN_PROGRESS" || currentStatus === "PENDING";

  return (
    <ListItem
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        mb: 1,
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: 2,
          mb: expanded ? 2 : 0,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle1">Job {job.id}</Typography>
            <JobStatusChip status={currentStatus} />
            {isLoadingStatus && <CircularProgress size={16} />}
          </Box>

          <Typography variant="body2" color="textSecondary">
            Created: {new Date(job.createdAt).toLocaleString()}
          </Typography>

          {isActive && (
            <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ flex: 1, height: 8, borderRadius: 1 }}
              />
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ minWidth: 40 }}
              >
                {progress}%
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {isActive && (
            <Button
              color="error"
              onClick={() => onCancel(job.id)}
              disabled={isCancelling}
              size="small"
            >
              Cancel
            </Button>
          )}
          {(result || error) && (
            <IconButton onClick={() => setExpanded(!expanded)} size="small">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Paper sx={{ p: 2, bgcolor: "background.default" }}>
          {error && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                Error Details
              </Typography>
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            </Box>
          )}

          {result && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Generation Results
              </Typography>

              {result.assignments && (
                <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                  ✓ Generated {result.assignments.length} slot assignments
                </Typography>
              )}

              {result.stats && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {result.stats.completionRate !== undefined && (
                      <Paper
                        sx={{ p: 1.5, textAlign: "center", flex: "1 1 200px" }}
                      >
                        <Typography variant="caption" color="textSecondary">
                          Completion Rate
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {result.stats.completionRate.toFixed(1)}%
                        </Typography>
                      </Paper>
                    )}

                    {result.stats.avgCognitiveLoad !== undefined && (
                      <Paper
                        sx={{ p: 1.5, textAlign: "center", flex: "1 1 200px" }}
                      >
                        <Typography variant="caption" color="textSecondary">
                          Avg Cognitive Load
                        </Typography>
                        <Typography variant="h6">
                          {result.stats.avgCognitiveLoad.toFixed(1)}
                        </Typography>
                      </Paper>
                    )}

                    {result.stats.conflicts !== undefined && (
                      <Paper
                        sx={{ p: 1.5, textAlign: "center", flex: "1 1 200px" }}
                      >
                        <Typography variant="caption" color="textSecondary">
                          Conflicts
                        </Typography>
                        <Typography
                          variant="h6"
                          color={
                            result.stats.conflicts === 0
                              ? "success.main"
                              : "warning.main"
                          }
                        >
                          {result.stats.conflicts}
                        </Typography>
                      </Paper>
                    )}

                    {result.stats.assignedLectures !== undefined &&
                      result.stats.totalLectures !== undefined && (
                        <Paper
                          sx={{
                            p: 1.5,
                            textAlign: "center",
                            flex: "1 1 200px",
                          }}
                        >
                          <Typography variant="caption" color="textSecondary">
                            Assigned Lectures
                          </Typography>
                          <Typography variant="h6">
                            {result.stats.assignedLectures} /{" "}
                            {result.stats.totalLectures}
                          </Typography>
                        </Paper>
                      )}
                  </Box>

                  {result.stats.highestLoadTeacher && (
                    <Paper sx={{ p: 1.5 }}>
                      <Typography variant="caption" color="textSecondary">
                        Highest Load Teacher
                      </Typography>
                      <Typography variant="body2">
                        {result.stats.highestLoadTeacher}
                      </Typography>
                    </Paper>
                  )}

                  {result.stats.dayDistribution &&
                    Object.keys(result.stats.dayDistribution).length > 0 && (
                      <Paper sx={{ p: 1.5 }}>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          gutterBottom
                        >
                          Distribution by Day
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                            mt: 1,
                          }}
                        >
                          {Object.entries(result.stats.dayDistribution).map(
                            ([day, count]) => (
                              <Box
                                key={day}
                                sx={{
                                  p: 1,
                                  bgcolor: "action.hover",
                                  borderRadius: 1,
                                  minWidth: 60,
                                  textAlign: "center",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                >
                                  {day}
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {count}
                                </Typography>
                              </Box>
                            ),
                          )}
                        </Box>
                      </Paper>
                    )}
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Collapse>
    </ListItem>
  );
}
