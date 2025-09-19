import React from "react";
import { TableCell, TableRow } from "@mui/material";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import {
  useBusySlotsByClassroom,
  useBusySlotsBySubdivision,
  useBusySlotsByTeacher,
} from "../-hooks";
import Slot from "./Slot";
import { useCollections } from "@/db-collections/providers/useCollections";

function Row({
  viewAllData,
  day,
  handleDrawerOpen,
  setSelectedSlotId,
}: {
  viewAllData: boolean;
  day: number;
  handleDrawerOpen: () => void;
  setSelectedSlotId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
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
          setSelectedSlotId={setSelectedSlotId}
        />
      ))}
    </TableRow>
  );
}

interface DroppableCellProps {
  slotId: string;
  viewAllData: boolean;
  handleDrawerOpen: () => void;
  setSelectedSlotId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function DroppableCell({
  slotId,
  viewAllData,
  handleDrawerOpen,
  setSelectedSlotId,
}: DroppableCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
  });

  const handleClick = () => {
    handleDrawerOpen();
    setSelectedSlotId(slotId);
  };

  const { active } = useDndContext();
  const activeLectureSlotId = active?.id.toString() ?? "";

  // TODO: Get these as props/zustand, these hooks are being called in every slot separately
  const busySlotsByTeacher = useBusySlotsByTeacher(activeLectureSlotId);
  const busySlotsByClassroom = useBusySlotsByClassroom(activeLectureSlotId);
  const busySlotsBySubdivision = useBusySlotsBySubdivision(activeLectureSlotId);

  const isBusy =
    busySlotsByTeacher.has(slotId) ||
    busySlotsBySubdivision.has(slotId) ||
    busySlotsByClassroom.has(slotId);

  return (
    <TableCell
      key={slotId}
      ref={setNodeRef}
      onClick={handleClick}
      sx={{
        backgroundColor: isOver ? "rgba(0, 0, 0, 0.1)" : "transparent",
        transition: "background-color 0.2s ease",
      }}
    >
      <div className={isBusy ? "border-2 border-red-500 rounded-lg" : ""}>
        <Slot slotId={slotId} viewAllData={viewAllData} />
      </div>
    </TableCell>
  );
}

export default Row;
