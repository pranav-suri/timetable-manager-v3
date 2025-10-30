import { useFilteredLecturesInSlot } from "@/hooks/useFilteredLecturesInSlot";
import LectureSlot from "./LectureSlot";

function Slot({ slotId }: { slotId: string }) {
  const orderedCompleteLectures = useFilteredLecturesInSlot(slotId);
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
