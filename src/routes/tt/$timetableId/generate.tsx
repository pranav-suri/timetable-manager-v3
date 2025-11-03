import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Container,
  Typography,
} from "@mui/material";
import { useLiveQuery } from "@tanstack/react-db";
import type { PartialGAConfig } from "@/server/services/timetableGenerator/types";
import { useCollections } from "@/db-collections/providers/useCollections";
import { useJobs } from "@/hooks/useJobs";
import { GenerationControls } from "@/components/Generation/GenerationControls";
import { GenerationProgress } from "@/components/Generation/GenerationProgress";
import { GenerationResults } from "@/components/Generation/GenerationResults";
import { nanoid } from "nanoid";

export const Route = createFileRoute("/tt/$timetableId/generate")({
  component: RouteComponent,
});

function RouteComponent() {
  const { timetableId } = Route.useParams();
  const {
    timetableCollection,
    lectureCollection,
    slotCollection,
    generationConfigCollection,
  } = useCollections();

  // Fetch timetable data to show context
  const { data: timetables } = useLiveQuery(
    (q) => q.from({ timetableCollection }),
    [timetableCollection],
  );

  const { data: lectures } = useLiveQuery(
    (q) => q.from({ lectureCollection }),
    [lectureCollection],
  );

  const { data: slots } = useLiveQuery(
    (q) => q.from({ slotCollection }),
    [slotCollection],
  );

  // Load saved generation config
  const { data: savedConfigs } = useLiveQuery(
    (q) => q.from({ generationConfig: generationConfigCollection }),
    [generationConfigCollection],
  );

  const savedConfig = savedConfigs[0];
  const config: PartialGAConfig = JSON.parse(savedConfig?.config || "{}");

  const currentTimetable = timetables.find((t) => t.id === timetableId);

  // Use jobs hook for generation management
  const {
    jobs,
    isLoading,
    startGeneration,
    isStarting,
    cancelJob,
    isCancelling,
    useJobStatus,
  } = useJobs(timetableId);

  // Get the most recent job
  const latestJob = jobs[0];

  const handleConfigChange = (newConfig: PartialGAConfig) => {
    // Save config to database
    if (savedConfig) {
      generationConfigCollection.update(savedConfig.id, (draft) => {
        draft.config = JSON.stringify(newConfig);
        draft.updatedAt = new Date();
      });
    } else {
      generationConfigCollection.insert({
        id: nanoid(4),
        timetableId,
        config: JSON.stringify(newConfig),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  };

  const handleStartGeneration = () => {
    startGeneration(config);
  };

  // Check if we have the minimum data to generate
  const canGenerate = lectures.length > 0 && slots.length > 0;
  const hasInsufficientData = !canGenerate;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Generate Timetable
      </Typography>

      {currentTimetable && (
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          {currentTimetable.name}
        </Typography>
      )}

      {hasInsufficientData && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Insufficient data to generate timetable. Please ensure you have:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
            <li>At least one lecture defined</li>
            <li>At least one time slot defined</li>
            <li>At least one classroom available</li>
            <li>At least one teacher assigned to subjects</li>
          </Typography>
        </Alert>
      )}

      {/* Generation Control Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <GenerationControls
            config={config}
            onConfigChange={handleConfigChange}
            onStartGeneration={handleStartGeneration}
            isStarting={isStarting}
            disabled={hasInsufficientData || isStarting}
          />
        </CardContent>
      </Card>

      {/* Progress Display for Active Job */}
      {latestJob &&
        (latestJob.status === "IN_PROGRESS" ||
          latestJob.status === "PENDING") && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <GenerationProgress
                job={latestJob}
                useJobStatus={useJobStatus}
                onCancel={cancelJob}
                isCancelling={isCancelling}
              />
            </CardContent>
          </Card>
        )}

      {/* Results Display for Completed/Failed Jobs */}
      {jobs.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Generation History
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {jobs.map((job) => (
                <GenerationResults
                  key={job.id}
                  job={job}
                  useJobStatus={useJobStatus}
                  timetableId={timetableId}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {jobs.length === 0 && !isLoading && (
        <Card>
          <CardContent>
            <Typography color="textSecondary" textAlign="center">
              No generation jobs yet. Click "Start Generation" to begin.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
