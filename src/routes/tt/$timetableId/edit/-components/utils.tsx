import { Typography } from "@mui/material";
import type { getLectureSlotCollection } from "@/db-collections/lectureSlotCollection";

export const getInitials = (name: string) => {
  // get all initials (eg: Dr. Nilima Zade = DNZ)
  const initials = name.match(/\b\w/g) || [];
  return initials.map((initial) => initial.toUpperCase()).join("");
};

export function formatNames(
  items: Array<{
    id: string;
    name: string;
  }>,
) {
  return items.map((item, index) => (
    <Typography key={item.id}>
      {" "}
      {item.name}
      {index !== items.length - 1 && ","}
    </Typography>
  ));
}

export function moveLectureSlot(
  lectureSlotCollection: ReturnType<typeof getLectureSlotCollection>,
  lectureSlotId: string,
  newSlotId: string,
) {
  lectureSlotCollection.update(lectureSlotId, (draft) => {
    draft.slotId = newSlotId;
  });
  console.log(`Moved lectureSlot ${lectureSlotId} to slot ${newSlotId}`);
}

export function setIsLocked(
  lectureSlotCollection: ReturnType<typeof getLectureSlotCollection>,
  lectureSlotId: string,
  isLocked: boolean,
) {
  lectureSlotCollection.update(lectureSlotId, (draft) => {
    draft.isLocked = isLocked;
  });
  // console.log(`Set lectureSlot ${lectureSlotId} isLocked to ${isLocked}`);
}
