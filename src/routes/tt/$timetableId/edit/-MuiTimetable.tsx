import React, { useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { eq, useLiveQuery } from "@tanstack/react-db";
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
  const busySlotsByTeacher = useBusySlotsByTeacher(activeId);
  const busySlotsByTeacherNew = useBusySlotsByTeacherNew(activeId);

  const busySlotsByClassroom = useBusySlotsByClassroom(activeId);
  const busySlotsBySubdivision = useBusySlotsBySubdivision(activeId);

  console.log("busySlotsByTeacher", busySlotsByTeacher);
  console.log("busySlotsByTeacherNew", busySlotsByTeacherNew);
  console.log("busySlotsByClassroom", busySlotsByClassroom);
  console.log("busySlotsBySubdivision", busySlotsBySubdivision);
  console.log("===========");

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
        console.log(`Moved lectureSlot ${active.id} to slot ${over.id}`);
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      // autoScroll={true}
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

function useBusySlotsByTeacher(lectureSlotId: string | null) {
  const { lectureSlotCollection, lectureCollection } = useCollections();
  // Get all lectureSlots
  const { data: allLectureSlots, collection: allLectureSlotCollection } =
    useLiveQuery((q) => q.from({ lectureSlot: lectureSlotCollection }));

  // Get all lectures
  const { data: allLectures, collection: allLectureCollection } = useLiveQuery(
    (q) => q.from({ lecture: lectureCollection }),
  );

  if (!lectureSlotId) {
    return new Set<string>();
  }

  // Get lectureId from lectureSlot
  const lectureSlot = allLectureSlotCollection.get(lectureSlotId);
  if (!lectureSlot) return new Set<string>();

  // Get teacherId from lecture
  const lecture = allLectureCollection.get(lectureSlot.lectureId);
  if (!lecture) return new Set<string>();

  // Get all lectures for the teacher
  const teacherLectures = allLectures.filter(
    (l) => l.teacherId === lecture.teacherId,
  );

  // Get all lectureSlots for these lectures
  const busyLectureSlots = allLectureSlots.filter((ls) =>
    teacherLectures.some((tl) => tl.id === ls.lectureId),
  );

  // Extract slotIds
  return new Set(busyLectureSlots.map((ls) => ls.slotId));
}

function useBusySlotsByTeacherNew(lectureSlotId: string | null) {
  const {
    lectureSlotCollection,
    lectureCollection,
    completeLectureOnlyCollection,
  } = useCollections();

  let teacherId = "";

  // Get all lectureSlots
  const { collection: allLectureSlotCollection } = useLiveQuery((q) =>
    q.from({ lectureSlot: lectureSlotCollection }),
  );

  // Get all lectures
  const { collection: allLectureCollection } = useLiveQuery((q) =>
    q.from({ lecture: lectureCollection }),
  );

  // Get lectureId from lectureSlot
  const lectureSlot = allLectureSlotCollection.get(lectureSlotId ?? "");

  // Get teacherId from lecture
  const lecture = allLectureCollection.get(lectureSlot?.lectureId ?? "");

  teacherId = lecture?.teacherId ?? "";

  // Get busy lectureSlots
  const { data: busyLectureSlots } = useLiveQuery(
    (q) =>
      q
        .from({ comp: completeLectureOnlyCollection })
        .where(({ comp }) => eq(comp.teacherId, teacherId)),
    [teacherId],
  );

  // Extract slotIds
  const slotIds = new Set(busyLectureSlots.map((ls) => ls.slotId));
  return slotIds;
}

function useBusySlotsByClassroom(lectureSlotId: string | null) {
  const {
    lectureSlotCollection,
    lectureCollection,
    lectureClassroomCollection,
  } = useCollections();
  // Get all lectureSlots
  const { data: allLectureSlots, collection: allLectureSlotCollection } =
    useLiveQuery((q) => q.from({ lectureSlot: lectureSlotCollection }));

  // Get all lectures
  const { collection: allLectureCollection } = useLiveQuery((q) =>
    q.from({ lecture: lectureCollection }),
  );

  // Get all lectureClassrooms
  const { data: allLectureClassrooms } = useLiveQuery((q) =>
    q.from({ lectureClassroom: lectureClassroomCollection }),
  );

  if (!lectureSlotId) return new Set<string>();

  // Get lectureId from lectureSlot
  const lectureSlot = allLectureSlotCollection.get(lectureSlotId);
  if (!lectureSlot) return new Set<string>();

  // Get lecture
  const lecture = allLectureCollection.get(lectureSlot.lectureId);
  if (!lecture) return new Set<string>();

  // Find all classrooms for the initial lecture
  const lectureClassroomsForInitialLecture = allLectureClassrooms.filter(
    (lc) => lc.lectureId === lecture.id,
  );

  // Create a Set of classroomIds for efficient lookup
  const classroomIdsForInitialLecture = new Set(
    lectureClassroomsForInitialLecture.map((lc) => lc.classroomId),
  );

  // Find all other lectureClassrooms that share a classroom
  const busyLectureClassrooms = allLectureClassrooms.filter((lc) =>
    classroomIdsForInitialLecture.has(lc.classroomId),
  );

  // Extract all unique lecture IDs from the busy lectureClassrooms
  const busyLectureIds = new Set(busyLectureClassrooms.map((l) => l.lectureId));

  // Find all lectureSlots associated with these busy lecture IDs
  const busyLectureSlots = allLectureSlots.filter((ls) =>
    busyLectureIds.has(ls.lectureId),
  );

  // Extract slotIds
  return new Set(busyLectureSlots.map((ls) => ls.slotId));
}

function useBusySlotsBySubdivision(lectureSlotId: string | null) {
  const {
    lectureSlotCollection,
    lectureCollection,
    lectureSubdivisionCollection,
  } = useCollections();
  // Get all lectureSlots
  const { data: allLectureSlots, collection: allLectureSlotCollection } =
    useLiveQuery((q) => q.from({ lectureSlot: lectureSlotCollection }));

  // Get all lectures
  const { collection: allLectureCollection } = useLiveQuery((q) =>
    q.from({ lecture: lectureCollection }),
  );

  // Get all lectureSubdivisions
  const { data: allLectureSubdivisions } = useLiveQuery((q) =>
    q.from({ lectureSubdivision: lectureSubdivisionCollection }),
  );

  if (!lectureSlotId) return new Set<string>();

  // Get lectureId from lectureSlot
  const lectureSlot = allLectureSlotCollection.get(lectureSlotId);
  if (!lectureSlot) return new Set<string>();

  // Get lecture
  const lecture = allLectureCollection.get(lectureSlot.lectureId);
  if (!lecture) return new Set<string>();

  // Find all subdivisions for the initial lecture
  const lectureSubdivisionsForInitialLecture = allLectureSubdivisions.filter(
    (lc) => lc.lectureId === lecture.id,
  );

  // Create a Set of subdivisionIds for efficient lookup
  const subdivisionIdsForInitialLecture = new Set(
    lectureSubdivisionsForInitialLecture.map((lc) => lc.subdivisionId),
  );

  // Find all other lectureSubdivisions that share a subdivision
  const busyLectureSubdivisions = allLectureSubdivisions.filter((lc) =>
    subdivisionIdsForInitialLecture.has(lc.subdivisionId),
  );

  // Extract all unique lecture IDs from the busy lectureSubdivisions
  const busyLectureIds = new Set(
    busyLectureSubdivisions.map((l) => l.lectureId),
  );

  // Find all lectureSlots associated with these busy lecture IDs
  const busyLectureSlots = allLectureSlots.filter((ls) =>
    busyLectureIds.has(ls.lectureId),
  );

  // Extract slotIds
  return new Set(busyLectureSlots.map((ls) => ls.slotId));
}
