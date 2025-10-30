import { useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";

interface SampleDataCreatorProps {
  onTimetableCreated: (timetableId: string) => void;
}

export function SampleDataCreator({
  onTimetableCreated,
}: SampleDataCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSampleData = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/generate/sample-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timetableName: "Test Timetable " + Date.now(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        onTimetableCreated(result.timetableId);
        alert(
          `Sample data created successfully!\nTimetable ID: ${result.timetableId}\nStats: ${JSON.stringify(result.stats, null, 2)}`,
        );
      } else {
        alert(`Failed to create sample data: ${result.error}`);
      }
    } catch (error) {
      alert(
        `Error creating sample data: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        onClick={handleCreateSampleData}
        disabled={isCreating}
        sx={{ mr: 2 }}
      >
        {isCreating ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Creating Sample Data...
          </>
        ) : (
          "Create Sample Data"
        )}
      </Button>
      <Typography variant="caption" color="textSecondary">
        This will create a new timetable with sample data for testing
      </Typography>
    </Box>
  );
}
