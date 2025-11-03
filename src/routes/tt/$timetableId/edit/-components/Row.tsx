import { TableCell, TableRow, useTheme } from "@mui/material";
import { and, eq, useLiveQuery, not } from "@tanstack/react-db";
import { useDndContext, useDroppable } from "@dnd-kit/core";
import Slot from "./Slot";
import { useCollections } from "@/db-collections/providers/useCollections";
import { WEEK_DAYS } from "@/utils/constants";

interface RowProps {
  day: number;
  handleDrawerOpen: () => void;
  busySlots: Set<string>;
}

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
    <TableRow sx={{ height: 100 }}>
      <TableCell>{WEEK_DAYS[day - 1]}</TableCell>

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
  const theme = useTheme();
  const { lectureSlotCollection } = useCollections();
  const { active } = useDndContext();

  const activeLectureSlotId = active?.id.toString() ?? "";
  const activeLectureSlot = lectureSlotCollection.get(activeLectureSlotId);

  const activeLectureId = activeLectureSlot?.lectureId ?? "";

  const { data: currentLectureSlot } = useLiveQuery(
    (q) =>
      q
        .from({ lS: lectureSlotCollection })
        .where(({ lS }) =>
          and(
            // find if there's a lecture slot in this cell for the active lecture
            and(eq(lS.slotId, slotId), eq(lS.lectureId, activeLectureId)),
            not(eq(lS.id, activeLectureSlotId)),
          ),
        )
        .findOne(),
    [slotId, activeLectureId, activeLectureSlotId, lectureSlotCollection],
  );
  const disabled = currentLectureSlot ? true : false;

  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    disabled,
    data: {
      disabled,
    },
  });

  const activeSlotId = activeLectureSlot?.slotId ?? "";
  const handleClick = () => {
    handleDrawerOpen();
  };

  const isInitial = activeSlotId === slotId; // if starting slot and current slot are the same
  const isBusy = busySlots.has(slotId);
  const isDark = theme.palette.mode === "dark";
  let bgColor: string;

  if (disabled) {
    bgColor = isDark
      ? "rgba(255, 255, 255, 0.1)" // lighter grey for dark mode
      : "rgba(128, 128, 128, 0.2)"; // light grey for light mode
  } else if (isInitial && isOver) {
    bgColor = isDark
      ? "rgba(255, 255, 255, 0.15)" // lighter for dark mode hover
      : "rgba(0, 0, 0, 0.2)"; // dark for light mode hover
  } else if (isInitial) {
    bgColor = isDark
      ? "rgba(255, 255, 255, 0.1)" // lighter for dark mode
      : "rgba(0, 0, 0, 0.15)"; // dark for light mode
  } else if (isBusy && isOver) {
    bgColor = isDark
      ? "rgba(255, 100, 100, 0.25)" // brighter red for dark mode hover
      : "rgba(255, 0, 0, 0.2)"; // red for light mode hover
  } else if (isBusy) {
    bgColor = isDark
      ? "rgba(255, 100, 100, 0.15)" // brighter red for dark mode
      : "rgba(255, 0, 0, 0.1)"; // red for light mode
  } else if (isOver) {
    bgColor = isDark
      ? "rgba(255, 255, 255, 0.15)" // lighter for dark mode hover
      : "rgba(0, 0, 0, 0.2)"; // dark for light mode hover
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
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Slot slotId={slotId} dropDisabled={disabled} />
    </TableCell>
  );
}
