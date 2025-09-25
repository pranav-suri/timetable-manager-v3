import { useContext } from "react";
import { Card, CardContent, CardHeader } from "@mui/material";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatNames, getInitials } from "./utils";
import getColor from "@/utils/getColor";
import { ThemeModeContext } from "@/context/ThemeModeContext";
import { useCollections } from "@/db-collections/providers/useCollections";

function LectureSlot({
  lectureSlotId,
  lectureId,
  teacherName,
  subjectName,
  viewAllData,
}: {
  lectureSlotId: string;
  lectureId: string;
  teacherName: string;
  subjectName: string;
  viewAllData: boolean;
}) {
  const { themeMode } = useContext(ThemeModeContext);
  const {
    lectureClassroomCollection,
    lectureSubdivisionCollection,
    classroomCollection,
    subdivisionCollection,
  } = useCollections();

  const { data: classrooms } = useLiveQuery(
    (q) =>
      q
        .from({ lectureClassroom: lectureClassroomCollection })
        .where(({ lectureClassroom }) =>
          eq(lectureClassroom.lectureId, lectureId),
        )
        .innerJoin(
          { classroom: classroomCollection },
          ({ lectureClassroom, classroom }) =>
            eq(lectureClassroom.classroomId, classroom.id),
        )
        .select(({ classroom }) => ({ ...classroom }))
        .orderBy(({ classroom }) => classroom.name),
    [lectureId],
  );
  const { data: subdivisions } = useLiveQuery(
    (q) =>
      q
        .from({ lectureSubdivision: lectureSubdivisionCollection })
        .where(({ lectureSubdivision }) =>
          eq(lectureSubdivision.lectureId, lectureId),
        )
        .innerJoin(
          { subdivision: subdivisionCollection },
          ({ lectureSubdivision, subdivision }) =>
            eq(lectureSubdivision.subdivisionId, subdivision.id),
        )
        .select(({ subdivision }) => ({ ...subdivision }))
        .orderBy(({ subdivision }) => subdivision.name),
    [lectureId],
  );

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lectureSlotId });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  if (!teacherName || !subjectName) return <></>;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      sx={{
        backgroundColor: getColor(subjectName, themeMode),
        margin: "0.5rem",
        cursor: "grab",
        "&:active": {
          cursor: "grabbing",
        },
      }}
    >
      <CardHeader
        title={viewAllData ? subjectName : getInitials(subjectName)}
        slotProps={{ title: { fontWeight: "500", fontSize: "1rem" } }}
        sx={{ padding: 0, margin: "8px" }}
      />
      <CardContent sx={{ padding: 0, margin: "8px" }} style={{ padding: 0 }}>
        {viewAllData ? teacherName : getInitials(teacherName)}
        {viewAllData ? <br /> : ""}
        <>{formatNames(subdivisions)}</> {viewAllData ? <br /> : <></>}
        <>{formatNames(classrooms)}</>
      </CardContent>
    </Card>
  );
}

export default LectureSlot;
