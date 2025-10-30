import {
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from "@mui/material";
import { useLiveQuery } from "@tanstack/react-db";
import { useDndContext } from "@dnd-kit/core";
import { Row } from "./-components/Row";
import Headers from "./-components/Headers";
import { useBusySlots } from "./-hooks/-busySlotHooks";
import { FilterPanel } from "./-components/FilterPanel";
import { useCollections } from "@/db-collections/providers/useCollections";

export default function MuiTimetable({
  handleDrawerOpen,
}: {
  handleDrawerOpen: () => void;
}) {
  const { slotDays, slotNumbers } = useSlotDaysAndNumbers();
  const { active: activeLectureSlot } = useDndContext();
  const busySlots = useBusySlots(activeLectureSlot?.id.toString() ?? "");

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: 2,
        height: "100%",
      }}
    >
      {/* Filter Panel Sidebar */}
      <FilterPanel />

      {/* Timetable Grid */}
      <TableContainer component={Paper}>
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
                busySlots={busySlots}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export function useSlotDaysAndNumbers() {
  const { slotCollection } = useCollections();

  const { data: slotDays } = useLiveQuery(
    (q) =>
      q
        .from({ slot: slotCollection })
        .select(({ slot }) => ({ day: slot.day }))
        .distinct()
        .orderBy(({ slot }) => slot.day),
    [slotCollection],
  );

  const { data: slotNumbers } = useLiveQuery(
    (q) =>
      q
        .from({ slot: slotCollection })
        .select(({ slot }) => ({ number: slot.number }))
        .distinct()
        .orderBy(({ slot }) => slot.number),
    [slotCollection],
  );

  return { slotDays, slotNumbers };
}
