import { eq, useLiveQuery } from "@tanstack/react-db";
import LectureSlot from "./LectureSlot";
import { useCollections } from "@/db-collections/providers/useCollections";

function Slot({ slotId }: { slotId: string }) {
  const { subjectCollection, completeLectureOnlyCollection } = useCollections();

  const { data: orderedCompleteLectures } = useLiveQuery(
    (q) =>
      q
        .from({ item: completeLectureOnlyCollection })
        .where(({ item }) => eq(item.slotId, slotId))
        .innerJoin({ subject: subjectCollection }, ({ item, subject }) =>
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
        />
      ))}
    </div>
  );
}

export default Slot;
