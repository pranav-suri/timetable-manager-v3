import React, { useContext, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { eq, useLiveQuery } from "@tanstack/react-db";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import getColor from "@/utils/getColor";
import { ThemeModeContext } from "@/context/ThemeModeContext";
import { useCollections } from "@/db-collections/providers/useCollections";

const getInitials = (name: string) => {
  // get all initials (eg: Dr. Nilima Zade = DNZ)
  const initials = name.match(/\b\w/g) || [];
  return initials.map((initial) => initial.toUpperCase()).join("");
};

function printClasses(
  classrooms: Array<{
    id: string;
    name: string;
  }>,
) {
  return classrooms.map((classroom, classroomIndex) => (
    <Typography key={classroom.id}>
      {" "}
      {classroom.name}
      {classroomIndex !== classrooms.length - 1 && ","}
    </Typography>
  ));
}
function printSubdivisions(
  subdivisions: Array<{
    id: string;
    name: string;
  }>,
) {
  return subdivisions.map((subdivision, subdivisionsIndex) => (
    <Typography key={subdivision.id}>
      {" "}
      {subdivision.name}
      {subdivisionsIndex !== subdivisions.length - 1 && ","}
    </Typography>
  ));
}

function Cell({
  lectureSlotId,
  lectureId,
  teacherName,
  subjectName,
  viewAllData,
}: {
  lectureSlotId: string;
  lectureId: string;
  teacherName: string;
  subjectName: string;
  viewAllData: boolean;
}) {
  const { themeMode } = useContext(ThemeModeContext);
  const {
    lectureClassroomCollection,
    lectureSubdivisionCollection,
    classroomCollection,
    subdivisionCollection,
  } = useCollections();

  const { data: classrooms } = useLiveQuery((q) =>
    q
      .from({ lectureClassroom: lectureClassroomCollection })
      .where(({ lectureClassroom }) =>
        eq(lectureClassroom.lectureId, lectureId),
      )
      .innerJoin(
        { classroom: classroomCollection },
        ({ lectureClassroom, classroom }) =>
          eq(lectureClassroom.classroomId, classroom.id),
      )
      .select(({ classroom }) => ({ ...classroom }))
      .orderBy(({ classroom }) => classroom.name),
  );
  const { data: subdivisions } = useLiveQuery((q) =>
    q
      .from({ lectureSubdivision: lectureSubdivisionCollection })
      .where(({ lectureSubdivision }) =>
        eq(lectureSubdivision.lectureId, lectureId),
      )
      .innerJoin(
        { subdivision: subdivisionCollection },
        ({ lectureSubdivision, subdivision }) =>
          eq(lectureSubdivision.subdivisionId, subdivision.id),
      )
      .select(({ subdivision }) => ({ ...subdivision }))
      .orderBy(({ subdivision }) => subdivision.name),
  );

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lectureSlotId });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!teacherName || !subjectName) return <></>;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      sx={{
        backgroundColor: getColor(subjectName, themeMode),
        margin: "0.5rem",
        cursor: "grab",
        "&:active": {
          cursor: "grabbing",
        },
      }}
    >
      <CardHeader
        title={viewAllData ? subjectName : getInitials(subjectName)}
        titleTypographyProps={{ fontWeight: "500", fontSize: "1rem" }}
        sx={{ padding: 0, margin: "8px" }}
      />
      <CardContent sx={{ padding: 0, margin: "8px" }} style={{ padding: 0 }}>
        {viewAllData ? teacherName : getInitials(teacherName)}
        {viewAllData ? <br /> : ""}
        {printSubdivisions(subdivisions)} {viewAllData ? <br /> : <></>}
        {printClasses(classrooms)}
      </CardContent>
    </Card>
  );
}

function Slot({
  slotId,
  viewAllData,
}: {
  slotId: string;
  viewAllData: boolean;
}) {
  const {
    lectureSlotCollection,
    lectureCollection,
    teacherCollection,
    subjectCollection,
  } = useCollections();
  const { data: lectureSlots } = useLiveQuery((q) =>
    q
      .from({ lectureSlot: lectureSlotCollection })
      .where(({ lectureSlot }) => eq(lectureSlot.slotId, slotId)),
  );
  const { collection: allLecturesCollection } = useLiveQuery((q) =>
    q.from({ lectureCollection }),
  );
  const { collection: allTeachersCollection } = useLiveQuery((q) =>
    q.from({ teacherCollection }),
  );
  const { collection: allSubjectsCollection } = useLiveQuery((q) =>
    q.from({ subjectCollection }),
  );

  return (
    <div>
      {lectureSlots.map((lectureSlot) => (
        <Cell
          key={lectureSlot.id}
          lectureSlotId={lectureSlot.id}
          lectureId={lectureSlot.lectureId}
          subjectName={
            allSubjectsCollection.get(
              allLecturesCollection.get(lectureSlot.lectureId)?.subjectId ?? "",
            )?.name ?? ""
          }
          teacherName={
            allTeachersCollection.get(
              allLecturesCollection.get(lectureSlot.lectureId)?.teacherId ?? "",
            )?.name ?? ""
          }
          viewAllData={viewAllData}
        />
      ))}
    </div>
  );
}

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
      {/* <TableHead> */}
      <TableCell>{DAYS[day - 1]}</TableCell>
      {/* </TableHead> */}

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

function Headers({ slotNumbers }: { slotNumbers: number[] }) {
  const headers = (
    <React.Fragment>
      <TableCell key="days-slots-header">Days/Slots</TableCell>
      {slotNumbers.map((slotNumber) => (
        <TableCell key={slotNumber}>{slotNumber}</TableCell>
      ))}
    </React.Fragment>
  );
  return headers;
}

export default function MuiTimetable({
  handleDrawerOpen,
  setSelectedSlotId,
}: {
  handleDrawerOpen: () => void;
  setSelectedSlotId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [{ viewAllData }] = useState({ viewAllData: true });
  const [activeId, setActiveId] = useState<string | null>(null);
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
        // Update the lectureSlot with the new slotId using the collection update method
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

  const str = "Rendered";
  return (
    <DndContext
      // sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <TableContainer component={Paper} className="printable">
        {str}
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
