import type { DndContextProps, DragEndEvent } from "@dnd-kit/core";
import { useSensor, PointerSensor } from "@dnd-kit/core";
import { useCollections } from "@/db-collections/providers/useCollections";
import { moveLectureSlot } from "../-components/utils";

export function useTimetableDnD() {
  const { lectureSlotCollection } = useCollections();
  type Handlers = Pick<
    DndContextProps,
    "onDragStart" | "onDragEnd" | "onDragCancel"
  >; // Done to ensure type safety of props, add more handler to type as required

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 1 },
  });

  // @ts-ignore Ignore unused variable warning
  const onDragStart = (event: DragStartEvent) => {
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
    if (!over) return;

    // Double-check that the lecture slot isn't locked (shouldn't happen with disabled drag)
    const lectureSlot = lectureSlotCollection.get(active.id.toString());
    if (lectureSlot?.isLocked) {
      console.warn(`Attempted to move locked lectureSlot ${active.id}`);
      return;
    }

    moveLectureSlot(
      lectureSlotCollection,
      active.id.toString(),
      over.id.toString(),
    );
  };

  return {
    sensors: [pointerSensor],
    handlers: { onDragStart, onDragEnd, onDragCancel } satisfies Handlers,
  };
}
