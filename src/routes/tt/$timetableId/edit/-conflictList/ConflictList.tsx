// src/components/ConflictList/ConflictList.tsx
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  ClassroomInfo,
  LectureDetails,
  SlotInfo,
  SubdivisionInfo,
  TeacherInfo,
} from "./helpers";
import { useCombinedConflicts } from "./useCombinedConflicts";
import type { Conflict } from "./useCombinedConflicts";

function ConflictCard({ conflict }: { conflict: Conflict }) {
  const handleClick = () => {
    // TODO: Implement your on-click action here (e.g., open a modal)
    console.log("Conflict clicked:", conflict);
  };

  return (
    <Card
      variant="outlined"
      sx={{ mb: 1.5, cursor: "pointer" }}
      onClick={handleClick}
    >
      <CardContent>
        {conflict.teacherId && <TeacherInfo teacherId={conflict.teacherId} />}
        {conflict.classroomId && (
          <ClassroomInfo classroomId={conflict.classroomId} />
        )}
        {conflict.subdivisionId && (
          <SubdivisionInfo subdivisionId={conflict.subdivisionId} />
        )}
        <Box mt={1}>
          <Typography variant="subtitle2">Conflicting Lectures:</Typography>
          {conflict.lectureSlotIds.map((lsId) => (
            <LectureDetails key={lsId} lectureSlotId={lsId} />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export function ConflictList() {
  const combinedConflicts = useCombinedConflicts();
  const conflictSlots = Object.entries(combinedConflicts);

  if (conflictSlots.length === 0) {
    return <NoConflicts />;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Timetable Conflicts
      </Typography>
      {conflictSlots.map(([slotId, conflicts]) => (
        <Accordion key={slotId} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <SlotInfo slotId={slotId} />
          </AccordionSummary>
          <AccordionDetails>
            {conflicts.map((conflict, index) => (
              <ConflictCard
                key={`${conflict.teacherId || conflict.classroomId || conflict.subdivisionId}-${index}`}
                conflict={conflict}
              />
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

export function NoConflicts() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100%",
        py: 6,
        textAlign: "center",
      }}
    >
      <CheckCircleIcon
        sx={{
          fontSize: 80,
          color: "success.light",
          mb: 2,
          opacity: 0.7,
        }}
      />
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
        No Conflicts Found
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Timetable is perfectly scheduled.
      </Typography>
    </Box>
  );
}
