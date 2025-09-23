import { useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useLiveQuery } from "@tanstack/react-db";
import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core";
import { Row } from "./-components/Row";
import Headers from "./-components/Headers";
import { useBusySlots } from "./-hooks";
import { moveLectureSlot } from "./-components/utils";
import type {
  DndContextProps,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import { useCollections } from "@/db-collections/providers/useCollections";

export default function MuiTimetable({
  handleDrawerOpen,
}: {
  handleDrawerOpen: () => void;
}) {
  const [{ viewAllData }] = useState({ viewAllData: true });
  const { activeLectureSlotId, sensors, handlers } = useTimetableDnD();
  const { slotDays, slotNumbers } = useSlotDaysAndNumbers();
  const busySlots = useBusySlots(activeLectureSlotId);

  return (
    <DndContext
      {...handlers}
      // autoScroll={false}
      sensors={sensors}
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
                viewAllData={viewAllData}
                busySlots={busySlots}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </DndContext>
  );
}

export function useSlotDaysAndNumbers() {
  const { slotCollection } = useCollections();

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

  return { slotDays, slotNumbers };
}

export function useTimetableDnD() {
  const [activeLectureSlotId, setActiveId] = useState<string | null>(null);
  const { lectureSlotCollection } = useCollections();
  type Handlers = Pick<
    DndContextProps,
    "onDragStart" | "onDragEnd" | "onDragCancel"
  >; // Done to ensure type safety of props, add more handler to type as required

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 0 },
  });

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    moveLectureSlot(
      lectureSlotCollection,
      active.id.toString(),
      over.id.toString(),
    );
    setActiveId(null);
  };

  const onDragCancel = () => setActiveId(null);

  return {
    activeLectureSlotId,
    sensors: [pointerSensor],
    handlers: { onDragStart, onDragEnd, onDragCancel } satisfies Handlers,
  };
}
