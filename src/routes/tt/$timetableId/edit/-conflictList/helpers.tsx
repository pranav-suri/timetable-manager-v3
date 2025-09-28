import { Typography } from "@mui/material";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { DAYS } from "../-components/Row";
import { useCollections } from "@/db-collections/providers/useCollections";
// You would create a utility function for this
const formatSlot = (day: number, number: number) => {
  return `${DAYS[day - 1] ?? "N/A"}, Period ${number}`;
};

export function SlotInfo({ slotId }: { slotId: string }) {
  const { slotCollection } = useCollections();
  const slot = slotCollection.get(slotId); // Fetch data
  if (!slot) return null;
  return (
    <Typography variant="h6">{formatSlot(slot.day, slot.number)}</Typography>
  );
}

export function TeacherInfo({ teacherId }: { teacherId: string }) {
  const { teacherCollection } = useCollections();
  const teacher = teacherCollection.get(teacherId); // Fetch data
  return (
    <Typography>
      <b>Teacher:</b> {teacher?.name ?? "Loading..."}
    </Typography>
  );
}

export function ClassroomInfo({ classroomId }: { classroomId: string }) {
  const { classroomCollection } = useCollections();
  const classroom = classroomCollection.get(classroomId); // Fetch data
  return (
    <Typography>
      <b>Classroom:</b> {classroom?.name ?? "Loading..."}
    </Typography>
  );
}

export function SubdivisionInfo({ subdivisionId }: { subdivisionId: string }) {
  const { subdivisionCollection } = useCollections();
  const subdivision = subdivisionCollection.get(subdivisionId); // Fetch data
  return (
    <Typography>
      <b>Subdivision:</b> {subdivision?.name ?? "Loading..."}
    </Typography>
  );
}

export function LectureDetails({ lectureSlotId }: { lectureSlotId: string }) {
  const { lectureSlotCollection, lectureCollection, subjectCollection } =
    useCollections();

  const { data: lectureSlotMaybe } = useLiveQuery(
    (q) =>
      q
        .from({ lecSub: lectureSlotCollection })
        .where(({ lecSub }) => eq(lecSub.id, lectureSlotId)),
    [lectureSlotCollection, lectureSlotId],
  );

  const lectureSlot = lectureSlotMaybe.find(
    (lecSub) => lecSub.id === lectureSlotId,
  );
  if (!lectureSlot) return null;

  const lecture = lectureCollection.get(lectureSlot.lectureId);
  if (!lecture) return null;

  const subject = subjectCollection.get(lecture.subjectId);

  // This part assumes a way to get lectureSubdivisions by lectureId
  // Your exact implementation might vary
  //   const lectureSubdivisions = allLectureSubdivisions.find({
  //     lectureId: lecture.id,
  //   });
  //   const subdivisionNames = lectureSubdivisions
  //     .map((ls) => subdivisionCollection.get(ls.subdivisionId)?.name)
  //     .join(", ");

  return (
    <Typography variant="body2" color="text.secondary">
      - {subject?.name ?? "..."}
      {/* ({subdivisionNames || "..."}) */}
    </Typography>
  );
}
