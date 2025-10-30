import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";
import {
  GenerationOptionsForm,
  JobsList,
  SampleDataCreator,
} from "./generate/-components";
import type { GenerationOptions } from "./generate/-components";
import { useJobs } from "@/hooks/useJobs";

export const Route = createFileRoute("/generate")({
  component: TimetableGeneratePage,
});

function TimetableGeneratePage() {
  const [timetableId, setTimetableId] = useState("");
  const [options, setOptions] = useState<GenerationOptions>({
    maxIterations: 10000,
    timeoutMinutes: 10,
    prioritizeTeacherPreferences: true,
    allowPartialSolutions: false,
    balanceCognitiveLoad: true,
    maxCognitiveLoad: 70,
  });

  const {
    jobs,
    isLoading,
    startGeneration,
    isStarting,
    cancelJob,
    isCancelling,
    useJobStatus,
  } = useJobs(timetableId);

  const handleStartGeneration = () => {
    if (!timetableId.trim()) {
      alert("Please enter a timetable ID");
      return;
    }
    startGeneration();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Timetable Generation
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Start New Generation
          </Typography>

          <TextField
            fullWidth
            label="Timetable ID"
            value={timetableId}
            onChange={(e) => setTimetableId(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Enter timetable ID"
          />

          <Box sx={{ mb: 2 }}>
            <SampleDataCreator onTimetableCreated={setTimetableId} />
          </Box>

          <GenerationOptionsForm
            options={options}
            onChange={setOptions}
            disabled={isStarting}
          />

          <Button
            variant="contained"
            onClick={handleStartGeneration}
            disabled={isStarting || !timetableId.trim()}
            sx={{ mt: 2 }}
          >
            {isStarting ? "Starting..." : "Start Generation"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Generation Jobs
          </Typography>

          <JobsList
            jobs={jobs}
            isLoading={isLoading}
            useJobStatus={useJobStatus}
            onCancelJob={cancelJob}
            isCancelling={isCancelling}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
