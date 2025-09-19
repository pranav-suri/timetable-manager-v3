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
    lectureSlotCollection,
    lectureCollection,
    teacherCollection,
    subjectCollection,
  } = useCollections();

  const { data: lectureSlots } = useLiveQuery((q) => {
    // 1. Define the first subquery: lectureSlot joined with lecture
    //    This subquery will produce a result set where each row has
    //    properties for both `lectureSlot` and `lecture`.
    // Soring by Subject
    const lectureSlotAndLecture = q
      .from({ lectureSlot: lectureSlotCollection })
      .where(({ lectureSlot }) => eq(lectureSlot.slotId, slotId))
      .innerJoin({ lecture: lectureCollection }, ({ lectureSlot, lecture }) =>
        eq(lectureSlot.lectureId, lecture.id),
      )
      .select(({ lectureSlot, lecture }) => ({
        ...lectureSlot,
        subjectId: lecture.subjectId,
      }));

    return q
      .from({ item: lectureSlotAndLecture })
      .join(
        { subject: subjectCollection },
        ({ item, subject }) => eq(item.subjectId, subject.id), // Access subjectId from the nested 'lecture' object
      )
      .orderBy(({ subject }) => subject.name)
      .select(({ item }) => ({
        ...item,
      }));
  });

  const { collection: allLecturesCollection } = useLiveQuery((q) =>
    q.from({ lectureCollection }),
  );
  const { collection: allTeachersCollection } = useLiveQuery((q) =>
    q.from({ teacherCollection }),
  );
  const { collection: allSubjectsCollection } = useLiveQuery((q) =>
    q.from({ subjectCollection }),
  );

  return (
    <div>
      {lectureSlots.map((lectureSlot) => (
        <LectureSlot
          key={lectureSlot.id}
          lectureSlotId={lectureSlot.id}
          lectureId={lectureSlot.lectureId}
          subjectName={
            allSubjectsCollection.get(
              allLecturesCollection.get(lectureSlot.lectureId)?.subjectId ?? "",
            )?.name ?? ""
          }
          teacherName={
            allTeachersCollection.get(
              allLecturesCollection.get(lectureSlot.lectureId)?.teacherId ?? "",
            )?.name ?? ""
          }
          viewAllData={viewAllData}
        />
      ))}
    </div>
  );
}

export default Slot;
