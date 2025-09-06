import React, { useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useLiveQuery } from "@tanstack/react-db";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import Row from "./-components/Row";
import Headers from "./-components/Headers";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useCollections } from "@/db-collections/providers/useCollections";

export default function MuiTimetable({
  handleDrawerOpen,
  setSelectedSlotId,
}: {
  handleDrawerOpen: () => void;
  setSelectedSlotId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [{ viewAllData }] = useState({ viewAllData: true });
  const [activeId, setActiveId] = useState<string | null>(null); // activeId contains lectureSlotId
  const { slotCollection, lectureSlotCollection } = useCollections();
  const { data: slotDays } = useLiveQuery((q) =>
    q
      .from({ slot: slotCollection })
      .select(({ slot }) => ({ day: slot.day }))
      .distinct()
      .orderBy(({ slot }) => slot.day),
  );

  const { data: slotNumbers } = useLiveQuery((q) =>
    q
      .from({ slot: slotCollection })
      .select(({ slot }) => ({ number: slot.number }))
      .distinct()
      .orderBy(({ slot }) => slot.number),
  );

  // const { data: availableSlots } = useLiveQuery((q) => {

  // });

  // const sensors = useSensors(
  //   useSensor(PointerSensor, {
  //     activationConstraint: {
  //       distance: 0,
  //     },
  //   }),
  //   useSensor(KeyboardSensor),
  // );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString()); // This will contain lectureSlotId
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      try {
        lectureSlotCollection.update(active.id, (draft) => {
          draft.slotId = over.id.toString(); // over.id contains the slotId
        });
        console.log(
          `Successfully moved lectureSlot ${active.id} to slot ${over.id}`,
        );
      } catch (error) {
        console.error("Failed to update lectureSlot:", error);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      // sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      autoScroll={true}
    >
      <TableContainer component={Paper} className="printable">
        <Table size="small">
          <TableHead>
            <TableRow>
              <Headers slotNumbers={slotNumbers.map((s) => s.number)} />
            </TableRow>
          </TableHead>
          <TableBody>
            {slotDays.map((s) => (
              <Row
                key={s.day}
                day={s.day}
                handleDrawerOpen={handleDrawerOpen}
                setSelectedSlotId={setSelectedSlotId}
                viewAllData={viewAllData}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <DragOverlay>
        {activeId ? (
          <div style={{ transform: "rotate(5deg)" }}>
            {/* TODO: Use this to display why a component cannot be dropped at that slot. */}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
