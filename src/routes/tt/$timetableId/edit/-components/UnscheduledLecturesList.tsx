import { Alert, Box } from "@mui/material";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { DraggableLectureCard } from "./DraggableLectureCard";
import { useCollections } from "@/db-collections/providers/useCollections";

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

  // Count lecture slots per lecture
  const lectureSlotCounts = new Map<string, number>();
  allLectureSlots.forEach((ls) => {
    lectureSlotCounts.set(ls.lectureId, (lectureSlotCounts.get(ls.lectureId) || 0) + 1);
  });

  // Filter to only unscheduled lectures (those with slot count < duration * count)
  const unscheduledLectures = allLectures.filter((lecture) => {
    const slotCount = lectureSlotCounts.get(lecture.id) || 0;
    return slotCount < lecture.duration * lecture.count;
  });

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