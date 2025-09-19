import { createFileRoute } from "@tanstack/react-router";
import {
  createLiveQueryCollection,
  eq,
  not,
  useLiveQuery,
} from "@tanstack/react-db";
import { nanoid } from "nanoid";
import { memo } from "react";
import { Demo } from "./-demo";
import { useCollections } from "@/db-collections/providers/useCollections";

export const Route = createFileRoute("/timetable/$timetableId/")({
  component: RouteComponent,
});

function useSubset() {
  const { timetableCollection } = useCollections();

  const stableCollection = createLiveQueryCollection((q) =>
    q
      .from({ tt: timetableCollection })
      .orderBy(({ tt }) => tt.createdAt, "asc")
      .limit(10),
  );

  return stableCollection;
}

function RouteComponent() {
  const stableCollection = useSubset();
  const {
    timetableCollection,
    lectureCollection,
    lectureWithSubdivisionCollection,
    lectureWithClassroomCollection,
    completeLectureOnlyCollection,
  } = useCollections();
  const { data: ttJoined } = useLiveQuery((q) =>
    q
      .from({ tt: timetableCollection })
      .where(({ tt }) => not(eq(tt.id, "")))
      .innerJoin({ lecture: lectureCollection }, ({ lecture, tt }) =>
        eq(lecture.timetableId, tt.id),
      ),
  );

  // console.log(ttJoined);
  const { data: subset } = useLiveQuery((q) =>
    q
      .from({ tt: timetableCollection })
      .orderBy(({ tt }) => tt.id, "asc")
      .limit(1),
  );
  // console.log("Teachers from collection:", teachers);
  const handleClick = () => {
    console.log("Button clicked");
    const tx = timetableCollection.insert({
      id: nanoid(4),
      name: nanoid(4),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const { data: completeLecturesOnly } = useLiveQuery((q) =>
    q.from({ completeLectureOnlyCollection }),
  );

  const { data: lectureWithSubdivision } = useLiveQuery((q) =>
    q.from({ lectureWithSubdivisionCollection }),
  );

  const { data: lectureWithClassroom } = useLiveQuery((q) =>
    q.from({ lectureWithClassroomCollection }),
  );

  const groupedTeachersBySlot: {
    [slotId: string]: {
      [teacherId: string]: string[]; // lectureSlotId
    };
  } = {};
  for (const row of completeLecturesOnly) {
    const slotId = row.slotId;
    const teacherId = row.teacherId;
    const lectureSlotId = row.lectureSlotId;

    // Ensure the slotId key exists in the top-level object
    groupedTeachersBySlot[slotId] ??= {};

    // Ensure the teacherId key exists within the slotId object
    groupedTeachersBySlot[slotId][teacherId] ??= [];

    // Push the lectureSlotId into the corresponding array
    groupedTeachersBySlot[slotId][teacherId].push(lectureSlotId);
  }
  console.log("Grouped Teachers: ", groupedTeachersBySlot);

  const groupedClassroomsBySlot: {
    [slotId: string]: {
      [classroomId: string]: string[]; // lectureSlotId
    };
  } = {};
  for (const row of lectureWithClassroom) {
    const slotId = row.completeLectureOnly.slotId;
    const lectureSlotId = row.completeLectureOnly.lectureSlotId;
    const classroomId = row.lectureClassroom?.classroomId;
    if (!classroomId) continue;

    // Ensure the slotId key exists in the top-level object
    groupedClassroomsBySlot[slotId] ??= {};

    // Ensure the classroomId key exists within the slotId object
    groupedClassroomsBySlot[slotId][classroomId] ??= [];

    // Push the lectureSlotId into the corresponding array
    groupedClassroomsBySlot[slotId][classroomId].push(lectureSlotId);
  }
  console.log("Grouped Classrooms: ", groupedClassroomsBySlot);

  const groupedSubdivisionsBySlot: {
    [slotId: string]: {
      [subdivisionId: string]: string[]; // lectureSlotId
    };
  } = {};
  for (const row of lectureWithSubdivision) {
    const slotId = row.completeLectureOnly.slotId;
    const lectureSlotId = row.completeLectureOnly.lectureSlotId;
    const subdivisionId = row.lectureSubdivision?.subdivisionId;
    if (!subdivisionId) continue;

    // Ensure the slotId key exists in the top-level object
    groupedSubdivisionsBySlot[slotId] ??= {};

    // Ensure the subdivisionId key exists within the slotId object
    groupedSubdivisionsBySlot[slotId][subdivisionId] ??= [];

    // Push the lectureSlotId into the corresponding array
    groupedSubdivisionsBySlot[slotId][subdivisionId].push(lectureSlotId);
  }
  console.log("Grouped Subdivisions: ", groupedSubdivisionsBySlot);

  const groupedSubdivisionsWithElectiveBySlot: {
    [slotId: string]: {
      [subdivisionId: string]: {
        // If there are more than one in false array, there is a conflict
        false: string[]; // lectureSlotId
        true: {
          // Subdivision can be in multiple lectureSlots within the same group.
          // Check if there are multiple groups
          [groupId: string]: string[]; // lectureSlotId}
        };
      };
    };
  } = {};
  for (const row of lectureWithSubdivision) {
    const slotId = row.completeLectureOnly.slotId;
    const lectureSlotId = row.completeLectureOnly.lectureSlotId;
    const subdivisionId = row.lectureSubdivision?.subdivisionId;
    const allowSimultaneous = row.completeLectureOnly.allowSimultaneous;
    const groupId = row.completeLectureOnly.groupId;

    if (!subdivisionId) continue;

    // Ensure the slotId key exists in the top-level object
    groupedSubdivisionsWithElectiveBySlot[slotId] ??= {};

    const slotEntry = groupedSubdivisionsWithElectiveBySlot[slotId];

    // Ensure the subdivisionId key exists within the slotId object
    slotEntry[subdivisionId] ??= { false: [], true: {} };

    if (allowSimultaneous) {
      slotEntry[subdivisionId].true[groupId] ??= [];
      slotEntry[subdivisionId].true[groupId].push(lectureSlotId);
    } else {
      slotEntry[subdivisionId].false.push(lectureSlotId);
    }
  }
  console.log(
    "Grouped Subdivisions with Elective: ",
    groupedSubdivisionsWithElectiveBySlot,
  );

  console.log("rendered");
  // console.log("Collection", timetableCollection);
  // const { data: timetables } = useLiveQuery(
  //   (q) => q.from({ timetableCollection }),
  // .where(({lectureClassroom}) => eq(lectureClassroom.id, "time")),
  // );
  // console.log("Timetables from collection:", subset);

  const lastItem = subset[subset.length - 1];
  if (!lastItem) return <>No items in array.</>;

  return (
    <div>
      <button onClick={handleClick}>Click me</button>
      <br />
      Hello "/timetable/$timetableId/sdakjladsvj"!
      <br />
      <Demo input={lastItem.id} />
    </div>
  );
}
