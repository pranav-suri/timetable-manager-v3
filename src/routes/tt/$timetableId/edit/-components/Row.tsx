import { TableCell, TableRow } from "@mui/material";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useDroppable } from "@dnd-kit/core";
import Slot from "./Slot";
import { useCollections } from "@/db-collections/providers/useCollections";

interface RowProps {
  day: number;
  handleDrawerOpen: () => void;
  busySlots: Set<string>;
}

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function Row({ day, handleDrawerOpen, busySlots }: RowProps) {
  const { slotCollection } = useCollections();

  const { data: slotsOfDay } = useLiveQuery(
    (q) =>
      q
        .from({ slot: slotCollection })
        .where(({ slot }) => eq(slot.day, day))
        .orderBy(({ slot }) => slot.number),
    [day, slotCollection],
  );

  return (
    <TableRow>
      <TableCell>{DAYS[day - 1]}</TableCell>

      {slotsOfDay.map((slot) => (
        <DroppableCell
          key={slot.id}
          slotId={slot.id}
          handleDrawerOpen={handleDrawerOpen}
          busySlots={busySlots}
        />
      ))}
    </TableRow>
  );
}

interface DroppableCellProps {
  slotId: string;
  handleDrawerOpen: () => void;
  busySlots: Set<string>;
}

export function DroppableCell({
  slotId,
  handleDrawerOpen,
  busySlots,
}: DroppableCellProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: slotId,
  });
  const { lectureSlotCollection } = useCollections();
  const lectureSlotId = active?.id.toString() ?? "";
  const initialSlotId = lectureSlotCollection.get(lectureSlotId)?.slotId ?? "";
  const handleClick = () => {
    handleDrawerOpen();
  };

  const isInitial = initialSlotId === slotId;
  const isBusy = busySlots.has(slotId);
  let bgColor: string;

  if (isInitial && isOver) {
    bgColor = "rgba(0, 0, 0, 0.2)"; // same as hovering
  } else if (isInitial) {
    bgColor = "rgba(0, 0, 0, 0.15)"; // light black/grey when initial
  } else if (isBusy && isOver) {
    bgColor = "rgba(255, 0, 0, 0.2)"; // darker red when busy and hovered
  } else if (isBusy) {
    bgColor = "rgba(255, 0, 0, 0.1)"; // light red when busy
  } else if (isOver) {
    bgColor = "rgba(0, 0, 0, 0.2)"; // light black/grey when hovered
  } else {
    bgColor = "transparent"; // default
  }

  return (
    <TableCell
      key={slotId}
      ref={setNodeRef}
      onClick={handleClick}
      sx={{
        backgroundColor: bgColor,
        transition: "background-color 0.2s ease",
      }}
    >
      <Slot slotId={slotId} />
    </TableCell>
  );
}
