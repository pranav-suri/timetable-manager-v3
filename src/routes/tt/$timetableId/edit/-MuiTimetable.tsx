import React, { useContext, useEffect, useState } from "react";
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

  if (!teacherName || !subjectName) return <></>;

  return (
    <Card
      sx={{
        backgroundColor: getColor(subjectName, themeMode),
        margin: "0.5rem",
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
        return (
          <TableCell
            key={slot.id}
            onClick={() => {
              handleDrawerOpen();
              setSelectedSlotId(slot.id);
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

  const str = "Rendered";
  return (
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
  );
}
