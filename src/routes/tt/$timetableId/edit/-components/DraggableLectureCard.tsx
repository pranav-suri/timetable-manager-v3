import { Card, CardContent, Typography, Box, useTheme } from "@mui/material";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import getColor from "@/utils/getColor";
import { useCollections } from "@/db-collections/providers/useCollections";
import { useLiveQuery, eq } from "@tanstack/react-db";

interface DraggableLectureCardProps {
  lecture: {
    id: string;
    subjectId: string;
    teacherId: string;
    count: number;
    duration: number;
    subjectName: string;
    teacherName: string;
  };
}

export function DraggableLectureCard({ lecture }: DraggableLectureCardProps) {
    const theme = useTheme();
    const {
    subdivisionCollection,
    classroomCollection,
    lectureSubdivisionCollection,
    lectureClassroomCollection,
  } = useCollections();

  // Get subdivisions for this lecture
  const { data: subdivisions } = useLiveQuery(
    (q) =>
      q
        .from({ lectureSubdivision: lectureSubdivisionCollection })
        .where(({ lectureSubdivision }) =>
          eq(lectureSubdivision.lectureId, lecture.id)
        )
        .innerJoin(
          { subdivision: subdivisionCollection },
          ({ lectureSubdivision, subdivision }) =>
            eq(lectureSubdivision.subdivisionId, subdivision.id)
        )
        .select(({ subdivision }) => ({ ...subdivision }))
        .orderBy(({ subdivision }) => subdivision.name),
    [lecture.id, lectureSubdivisionCollection, subdivisionCollection]
  );

  // Get classrooms for this lecture
  const { data: classrooms } = useLiveQuery(
    (q) =>
      q
        .from({ lectureClassroom: lectureClassroomCollection })
        .where(({ lectureClassroom }) =>
          eq(lectureClassroom.lectureId, lecture.id)
        )
        .innerJoin(
          { classroom: classroomCollection },
          ({ lectureClassroom, classroom }) =>
            eq(lectureClassroom.classroomId, classroom.id)
        )
        .select(({ classroom }) => ({ ...classroom }))
        .orderBy(({ classroom }) => classroom.name),
    [lecture.id, lectureClassroomCollection, classroomCollection]
  );

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${lecture.id}`,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const viewAllData = window.innerWidth > 1000;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      sx={{
        backgroundColor: getColor(lecture.subjectName, theme.palette.mode),
        margin: "0.25rem",
        cursor: "grab",
        "&:active": {
          cursor: "grabbing",
        },
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardContent sx={{ padding: "8px !important" }}>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          📚 {viewAllData ? lecture.subjectName : lecture.subjectName.slice(0, 8)}
        </Typography>
        <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
          👤 {viewAllData ? lecture.teacherName : lecture.teacherName.slice(0, 8)}
        </Typography>
        {subdivisions.length > 0 && (
          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
            👥 {subdivisions.map(s => s.name).join(", ")}
          </Typography>
        )}
        {classrooms.length > 0 && (
          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
            🏫 {classrooms.map(c => c.name).join(", ")}
          </Typography>
        )}
        <Typography variant="caption" display="block" sx={{ fontWeight: 500 }}>
          ⏱️ Count: {lecture.count} | Duration: {lecture.duration}
        </Typography>
      </CardContent>
    </Card>
  );
}