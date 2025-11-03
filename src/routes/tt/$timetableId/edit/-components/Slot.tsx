import { useFilteredLecturesInSlot } from "../-hooks/-useFilteredLecturesInSlot";
import LectureSlot from "./LectureSlot";

function Slot({
  slotId,
  dropDisabled = false,
}: {
  slotId: string;
  dropDisabled?: boolean;
}) {
  const orderedCompleteLectures = useFilteredLecturesInSlot(slotId);
  return (
    <div>
      {orderedCompleteLectures.map((completeLecture) => (
        <LectureSlot
          key={completeLecture.lectureSlotId}
          lectureSlotId={completeLecture.lectureSlotId}
          dropDisabled={dropDisabled}
        />
      ))}
    </div>
  );
}

export default Slot;
