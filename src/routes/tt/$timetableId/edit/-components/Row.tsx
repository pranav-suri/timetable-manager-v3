import React from "react";
import { TableCell, TableRow } from "@mui/material";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useDroppable } from "@dnd-kit/core";
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

      {slotsOfDay.map((slot) => {
        const { setNodeRef, isOver } = useDroppable({
          id: slot.id,
        });

        return (
          <TableCell
            key={slot.id}
            ref={setNodeRef}
            onClick={() => {
              handleDrawerOpen();
              setSelectedSlotId(slot.id);
            }}
            sx={{
              backgroundColor: isOver ? "rgba(0, 0, 0, 0.1)" : "transparent",
              transition: "background-color 0.2s ease",
            }}
          >
            <Slot slotId={slot.id} viewAllData={viewAllData} />
          </TableCell>
        );
      })}
    </TableRow>
  );
}

export default Row;
