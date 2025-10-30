import { Box, Alert } from "@mui/material";
import { useLiveQuery, eq } from "@tanstack/react-db";
import { useCollections } from "@/db-collections/providers/useCollections";
import { DraggableLectureCard } from "./DraggableLectureCard";

export function UnscheduledLecturesList() {
  const {
    lectureCollection,
    lectureSlotCollection,
    subjectCollection,
    teacherCollection,
  } = useCollections();

  // Get all lectures with their related data
  const { data: allLectures } = useLiveQuery(
    (q) =>
      q
        .from({ lecture: lectureCollection })
        .innerJoin(
          { subject: subjectCollection },
          ({ lecture, subject }) => eq(lecture.subjectId, subject.id)
        )
        .innerJoin(
          { teacher: teacherCollection },
          ({ lecture, teacher }) => eq(lecture.teacherId, teacher.id)
        )
        .orderBy(({ subject }) => subject.name)
        .select(({ lecture, subject, teacher }) => ({
          ...lecture,
          subjectName: subject.name,
          teacherName: teacher.name,
        })),
    [lectureCollection, subjectCollection, teacherCollection]
  );

  // Get all lecture slots to determine which lectures are scheduled
  const { data: allLectureSlots } = useLiveQuery(
    (q) => q.from({ lectureSlot: lectureSlotCollection }),
    [lectureSlotCollection]
  );

  // Filter to only unscheduled lectures (those with no lecture slots)
  const scheduledLectureIds = new Set(
    allLectureSlots.map((ls) => ls.lectureId)
  );

  const unscheduledLectures =
    allLectures.filter((lecture) => !scheduledLectureIds.has(lecture.id));

  if (unscheduledLectures.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 1 }}>
        No unscheduled lectures. All lectures have been assigned to the timetable.
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {unscheduledLectures.map((lecture) => (
        <DraggableLectureCard key={lecture.id} lecture={lecture} />
      ))}
    </Box>
  );
}