/**
 * GenericAvailabilityEditor Component
 *
 * A generic wrapper for managing unavailability constraints for any entity type.
 * Supports teachers, classrooms, and subdivisions through a unified interface.
 * Uses DB-side filtering for optimal performance.
 */

import { Box, Paper, Typography, CircularProgress, Alert } from "@mui/material";
import { useLiveQuery, eq } from "@tanstack/react-db";
import { AvailabilityGrid } from "./AvailabilityGrid";
import type { Slot, UnavailableSlot } from "./AvailabilityGrid";
import type { Collection } from "@tanstack/react-db";

// Define a common shape for unavailability documents
type UnavailabilityDoc = {
  id: string;
  slotId: string;
  isPreferred: boolean;
  [key: string]: any; // For teacherId, classroomId, subdivisionId, etc.
};

export interface GenericAvailabilityEditorProps {
  /** The specific ID of the entity (e.g., a teacher's ID) */
  entityId: string;
  /** The field name in the collection that holds the entityId (e.g., "teacherId") */
  idKey: "teacherId" | "classroomId" | "subdivisionId";
  /** The collection to query for all slots */
  slotCollection: Collection<any, any, any>;
  /** The collection to query and update for unavailability */
  unavailableCollection: Collection<any, any, any>;
  /** Title for the editor card */
  title: string;
  /** Description for the editor card */
  description: string;
}

export const GenericAvailabilityEditor = ({
  entityId,
  idKey,
  slotCollection,
  unavailableCollection,
  title,
  description,
}: GenericAvailabilityEditorProps) => {
  // Fetch all slots (this is acceptable, slots rarely change)
  const { data: slots, isLoading: slotsLoading } = useLiveQuery(
    (q) => q.from({ slotCollection }),
    [slotCollection],
  );

  // Fetch *only* unavailabilities for this specific entity (DB-side filtering)
  const { data: unavailables, isLoading: unavailablesLoading } = useLiveQuery(
    (q) =>
      q
        .from({ item: unavailableCollection })
        .where(({ item }) => eq((item as any)[idKey], entityId)),
    [unavailableCollection, entityId, idKey],
  );

  const isLoading = slotsLoading || unavailablesLoading;

  // Transform data to match AvailabilityGrid interface
  const gridSlots: Slot[] = slots.map((s: any) => ({
    id: s.id,
    day: s.day,
    number: s.number,
    timetableId: s.timetableId,
  }));

  const gridUnavailables: UnavailableSlot[] = unavailables.map((u) => ({
    id: u.id,
    slotId: u.slotId,
    isPreferred: u.isPreferred,
  }));

  const handleAdd = (slotId: string, isPreferred: boolean) => {
    void unavailableCollection.insert({
      id: crypto.randomUUID(),
      slotId,
      isPreferred,
      [idKey]: entityId, // Dynamically set 'teacherId', 'classroomId', or 'subdivisionId'
    } as any);
  };

  const handleUpdate = (id: string, isPreferred: boolean) => {
    void unavailableCollection.update(id, (draft) => {
      draft.isPreferred = isPreferred;
    });
  };

  const handleDelete = (id: string) => {
    void unavailableCollection.delete(id);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (slots.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No slots available. Please create slots for this timetable first.
      </Alert>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        bgcolor: "background.paper",
        color: "text.primary",
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" color="text.primary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>

      <AvailabilityGrid
        slots={gridSlots}
        unavailableSlots={gridUnavailables}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </Paper>
  );
};
