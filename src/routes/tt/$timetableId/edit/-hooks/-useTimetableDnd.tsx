import type { DndContextProps, DragEndEvent } from "@dnd-kit/core";
import { useSensor, PointerSensor } from "@dnd-kit/core";
import { useCollections } from "@/db-collections/providers/useCollections";
import { moveLectureSlot } from "../-components/utils";
import { nanoid } from "nanoid";

export function useTimetableDnD() {
  const { lectureSlotCollection, lectureCollection } = useCollections();
  type Handlers = Pick<
    DndContextProps,
    "onDragStart" | "onDragEnd" | "onDragCancel"
  >; // Done to ensure type safety of props, add more handler to type as required

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 1 },
  });

  // @ts-ignore Ignore unused variable warning
  const onDragStart = (event: DragStartEvent) => {
    console.log("Drag start active", event.active?.id);
    // Check if the lecture slot is locked
    const lectureSlot = lectureSlotCollection.get(event.active.id.toString());
    if (lectureSlot?.isLocked) {
      console.log(`Cannot drag locked lectureSlot ${event.active.id}`);
      // Note: The drag is already disabled in the useDraggable hook
      // This is just for additional safety/logging
    }
  };

  // @ts-ignore Ignore unused variable warning
  const onDragCancel = (event: DragCancelEvent) => {
    // You can add any logic needed when dragging is canceled
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    console.log("Drag end active", event.over);

    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Handle dropping lectureSlots on inventory area (delete them)
    if (overId === "inventory-drop-zone") {
      const lectureSlot = lectureSlotCollection.get(activeId);
      // Delete the lectureSlot from collection
      if (lectureSlot) lectureSlotCollection.delete(activeId);
      else {
        const lecture = lectureCollection.get(activeId);
        if (lecture) console.log(`Lecture ${activeId} is already in inventory`);
      }
      console.log(`Dropped on inventory zone`);
      return;
    }

    const lectureSlot = lectureSlotCollection.get(activeId);
    if (lectureSlot) {
      moveLectureSlot(lectureSlotCollection, activeId, overId);
    } else {
      const lecture = lectureCollection.get(activeId);
      if (lecture)
        lectureSlotCollection.insert({
          id: nanoid(4),
          lectureId: lecture.id,
          slotId: overId,
          isLocked: false,
        });
      console.log(`Scheduled lecture ${lecture?.id} to slot ${overId}`);
    }
    console.log(`Dropped on ${overId}`);
  };

  return {
    sensors: [pointerSensor],
    handlers: { onDragStart, onDragEnd, onDragCancel } satisfies Handlers,
  };
}
