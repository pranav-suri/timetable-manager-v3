import { Paper, Typography, Box } from "@mui/material";
import { DroppableInventoryArea } from "./DroppableInventoryArea";
import { UnscheduledLecturesList } from "./UnscheduledLecturesList";

export function InventorySidebar() {
  return (
    <Paper
      sx={{
        p: 2,
        height: "100%",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Unscheduled Lectures
      </Typography>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <DroppableInventoryArea />
        <UnscheduledLecturesList />
      </Box>
    </Paper>
  );
}