import { TableCell, TableRow } from "@mui/material";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useDroppable } from "@dnd-kit/core";
import Slot from "./Slot";
import { useCollections } from "@/db-collections/providers/useCollections";

interface RowProps {
  viewAllData: boolean;
  day: number;
  handleDrawerOpen: () => void;
  busySlotsByTeacher: Set<string>;
  busySlotsByClassroom: Set<string>;
  busySlotsBySubdivision: Set<string>;
}

export function Row({
  viewAllData,
  day,
  handleDrawerOpen,
  busySlotsByTeacher,
  busySlotsByClassroom,
  busySlotsBySubdivision,
}: RowProps) {
  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const { slotCollection } = useCollections();

  const { data: slotsOfDay } = useLiveQuery((q) =>
    q
      .from({ slot: slotCollection })
      .where(({ slot }) => eq(slot.day, day))
      .orderBy(({ slot }) => slot.number),
  );

  return (
    <TableRow>
      <TableCell>{DAYS[day - 1]}</TableCell>

      {slotsOfDay.map((slot) => (
        <DroppableCell
          key={slot.id}
          slotId={slot.id}
          viewAllData={viewAllData}
          handleDrawerOpen={handleDrawerOpen}
          busySlotsByTeacher={busySlotsByTeacher}
          busySlotsByClassroom={busySlotsByClassroom}
          busySlotsBySubdivision={busySlotsBySubdivision}
        />
      ))}
    </TableRow>
  );
}

interface DroppableCellProps {
  slotId: string;
  viewAllData: boolean;
  handleDrawerOpen: () => void;
  busySlotsByTeacher: Set<string>;
  busySlotsByClassroom: Set<string>;
  busySlotsBySubdivision: Set<string>;
}

export function DroppableCell({
  slotId,
  viewAllData,
  handleDrawerOpen,
  busySlotsByTeacher,
  busySlotsByClassroom,
  busySlotsBySubdivision,
}: DroppableCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
  });

  const handleClick = () => {
    handleDrawerOpen();
  };

  const isBusy =
    busySlotsByTeacher.has(slotId) ||
    busySlotsBySubdivision.has(slotId) ||
    busySlotsByClassroom.has(slotId);

  let bgColor: string;

  if (isBusy && isOver) {
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
      <Slot slotId={slotId} viewAllData={viewAllData} />
    </TableCell>
  );
}
