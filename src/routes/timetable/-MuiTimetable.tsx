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
import type { RouterOutput } from "@/integrations/trpc";
import getColor from "@/utils/getColor";
import { ThemeModeContext } from "@/context/ThemeModeContext";

type Timetable = RouterOutput["timetable"]["get"];
type Slot = Timetable["slots"][0];
type SlotData = Slot["lectureSlots"][0];
type Lecture = SlotData["lecture"];
type LectureSubdivision = Lecture["lectureSubdivisions"][0];
type LectureClassroom = Lecture["lectureClassrooms"][0];

const getInitials = (name: string) => {
  // get all initials (eg: Dr. Nilima Zade = DNZ)
  const initials = name.match(/\b\w/g) || [];
  return initials.map((initial) => initial.toUpperCase()).join("");
};

function printClasses(lectureClassrooms: LectureClassroom[]) {
  return lectureClassrooms.map((lectureClassroom, classroomIndex) => (
    <Typography key={classroomIndex}>
      {" "}
      {lectureClassroom.classroom.name}
      {classroomIndex !== lectureClassrooms.length - 1 && ","}
    </Typography>
  ));
}
function printSubdivisions(lectureSubdivisions: LectureSubdivision[]) {
  return lectureSubdivisions.map((lectureSubdivision, subdivisionsIndex) => (
    <Typography key={subdivisionsIndex}>
      {" "}
      {lectureSubdivision.subdivision.name}
      {subdivisionsIndex !== lectureSubdivisions.length - 1 && ","}
    </Typography>
  ));
}

function Cell({
  lecture,
  viewAllData,
}: {
  lecture: Lecture;
  viewAllData: boolean;
}) {
  const { themeMode } = useContext(ThemeModeContext);
  return (
    <Card
      sx={{
        backgroundColor: getColor(lecture.subject.name, themeMode),
        margin: "0.5rem",
      }}
    >
      <CardHeader
        title={
          viewAllData
            ? lecture.subject.name
            : getInitials(lecture.subject.name || "")
        }
        titleTypographyProps={{ fontWeight: "500", fontSize: "1rem" }}
        sx={{ padding: 0, margin: "8px" }}
      />
      <CardContent sx={{ padding: 0, margin: "8px" }} style={{ padding: 0 }}>
        {viewAllData ? lecture.teacher.name : ""}
        {viewAllData ? <br /> : ""}
        {printSubdivisions(lecture.lectureSubdivisions)}{" "}
        {viewAllData ? <br /> : <></>}
        {printClasses(lecture.lectureClassrooms)}
      </CardContent>
    </Card>
  );
}

function Slot({
  lectureSlots,
  viewAllData,
}: {
  lectureSlots: SlotData[];
  viewAllData: boolean;
}) {
  return (
    <div>
      {lectureSlots.map((dataItem, slotDataIndex: number) => (
        <Cell
          key={slotDataIndex}
          lecture={dataItem.lecture}
          viewAllData={viewAllData}
        />
      ))}
    </div>
  );
}

function Row({
  timetable,
  day,
  slotNumbers,
  viewAllData,
  handleDrawerOpen,
  setSelectedSlotIndex,
}: {
  timetable: Timetable;
  day: number;
  slotNumbers: Set<number>;
  viewAllData: boolean;
  handleDrawerOpen: () => void;
  setSelectedSlotIndex: React.Dispatch<React.SetStateAction<number | null>>;
}) {
  const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <TableRow>
      {/* <TableHead> */}
      <TableCell>{DAYS[day - 1]}</TableCell>
      {/* </TableHead> */}

      {Array.from(slotNumbers)
        .sort()
        .map((slotNumber) => {
          const slotIndex = timetable.slots.findIndex(
            (slot) => slot.day == day && slot.number == slotNumber,
          );
          if (slotIndex === -1)
            console.log(
              `Slot not found for day ${day} and slot number ${slotNumber}`,
            );

          return (
            <TableCell
              key={slotNumber}
              onClick={() => {
                handleDrawerOpen();
                setSelectedSlotIndex(slotIndex);
              }}
            >
              <Slot
                lectureSlots={timetable.slots[slotIndex].lectureSlots}
                viewAllData={viewAllData}
              />
            </TableCell>
          );
        })}
    </TableRow>
  );
}

function Headers({ slotNumbers }: { slotNumbers: Set<number> }) {
  const headers = (
    <React.Fragment>
      <TableCell key="days-slots-header">Days/Slots</TableCell>
      {Array.from(slotNumbers)
        .sort()
        .map((slotNumber) => (
          <TableCell key={slotNumber}>{slotNumber}</TableCell>
        ))}
    </React.Fragment>
  );
  return headers;
}

export default function MuiTimetable({
  timetableData,
  handleDrawerOpen,
  setSelectedSlotIndex,
}: {
  timetableData: Timetable;
  handleDrawerOpen: () => void;
  setSelectedSlotIndex: React.Dispatch<React.SetStateAction<number | null>>;
}) {
  const slotNumbers = new Set<number>();
  const slotDays = new Set<number>();
  const [{ viewAllData }] = useState({ viewAllData: true });

  timetableData.slots.forEach((slot) => {
    slotNumbers.add(slot.number);
    slotDays.add(slot.day);
  });

  return (
    <TableContainer component={Paper} className="printable">
      <Table size="small">
        <TableHead>
          <TableRow>
            <Headers slotNumbers={slotNumbers} />
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from(slotDays)
            .sort()
            .map((day) => (
              <Row
                key={day}
                timetable={timetableData}
                day={day}
                slotNumbers={slotNumbers}
                handleDrawerOpen={handleDrawerOpen}
                setSelectedSlotIndex={setSelectedSlotIndex}
                viewAllData={viewAllData}
              />
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
