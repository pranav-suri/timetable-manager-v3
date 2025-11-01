import { Box, Typography } from "@mui/material";
import { useDndContext , useDroppable} from "@dnd-kit/core";

export function DroppableInventoryArea() {
  const { active } = useDndContext();
  const { setNodeRef, isOver } = useDroppable({
    id: "inventory-drop-zone",
  });

  const isDraggingLectureSlot = active?.id.toString().startsWith("lectureSlot-");

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minHeight: 80,
        border: "2px dashed",
        borderColor: isOver && isDraggingLectureSlot ? "primary.main" : "grey.300",
        borderRadius: 1,
        p: 2,
        backgroundColor: isOver && isDraggingLectureSlot ? "primary.50" : "transparent",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography
        variant="body2"
        color={isOver && isDraggingLectureSlot ? "primary.main" : "text.secondary"}
        align="center"
      >
        {isOver && isDraggingLectureSlot
          ? "Drop here to unschedule lecture"
          : "Drag lecture slots here to return to inventory"}
      </Typography>
    </Box>
  );
}