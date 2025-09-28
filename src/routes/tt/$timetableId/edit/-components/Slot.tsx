import { eq, useLiveQuery } from "@tanstack/react-db";
import LectureSlot from "./LectureSlot";
import { useCollections } from "@/db-collections/providers/useCollections";

function Slot({
  slotId,
  viewAllData,
}: {
  slotId: string;
  viewAllData: boolean;
}) {
  const {
    teacherCollection,
    subjectCollection,
    completeLectureOnlyCollection,
  } = useCollections();

  const { data: orderedCompleteLectures } = useLiveQuery(
    (q) =>
      q
        .from({ item: completeLectureOnlyCollection })
        .where(({ item }) => eq(item.slotId, slotId))
        .join({ subject: subjectCollection }, ({ item, subject }) =>
          eq(item.subjectId, subject.id),
        )
        .orderBy(({ subject }) => subject.name)
        .select(({ item }) => ({ ...item })),
    [slotId, completeLectureOnlyCollection, subjectCollection],
  );

  return (
    <div>
      {orderedCompleteLectures.map((completeLecture) => (
        <LectureSlot
          key={completeLecture.lectureSlotId}
          lectureSlotId={completeLecture.lectureSlotId}
          lectureId={completeLecture.lectureId}
          subjectName={
            subjectCollection.get(completeLecture.subjectId)?.name ?? ""
          }
          teacherName={
            teacherCollection.get(completeLecture.teacherId)?.name ?? ""
          }
          viewAllData={viewAllData}
        />
      ))}
    </div>
  );
}

export default Slot;
