import { CircularProgress, List, Typography } from "@mui/material";
import { JobItem } from "./JobItem";
import type { Job } from "./types";

interface JobsListProps {
  jobs: Job[];
  isLoading: boolean;
  useJobStatus: (jobId: string) => any;
  onCancelJob: (jobId: string) => void;
  isCancelling: boolean;
}

export function JobsList({
  jobs,
  isLoading,
  useJobStatus,
  onCancelJob,
  isCancelling,
}: JobsListProps) {
  if (isLoading) {
    return <CircularProgress />;
  }

  if (jobs.length === 0) {
    return (
      <Typography color="textSecondary">
        No generation jobs found for this timetable.
      </Typography>
    );
  }

  return (
    <List>
      {jobs.map((job) => {
        const { data: statusData, isLoading: isLoadingStatus } = useJobStatus(
          job.id,
        );
        return (
          <JobItem
            key={job.id}
            job={job}
            statusData={statusData}
            isLoadingStatus={isLoadingStatus}
            onCancel={onCancelJob}
            isCancelling={isCancelling}
          />
        );
      })}
    </List>
  );
}
