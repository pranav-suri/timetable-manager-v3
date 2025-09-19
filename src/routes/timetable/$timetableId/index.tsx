import { createFileRoute } from "@tanstack/react-router";
import {
  concat,
  count,
  createLiveQueryCollection,
  eq,
  gt,
  not,
  useLiveQuery,
} from "@tanstack/react-db";
import { nanoid } from "nanoid";
import { Demo } from "./-demo";
import { useCollections } from "@/db-collections/providers/useCollections";

export const Route = createFileRoute("/timetable/$timetableId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const stableCollection = useSubset();
  const { timetableCollection, lectureCollection } = useCollections();
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
  const groupedTeachersBySlot = useGroupedTeachersBySlot();
  const groupedClassroomsBySlot = useGroupedClassroomsBySlot();
  const groupedSubdivisionsBySlot = useGroupedSubdivisionsBySlot();
  const groupedSubdivisionsWithElectiveBySlot =
    useGroupedSubdivisionsWithElectiveBySlot();
  const dbBasedGroupedTeachersBySlot = useDbBasedGroupedTeachersBySlot();

  console.log("Grouped Teachers: ", groupedTeachersBySlot);
  // console.log("Grouped Classrooms: ", groupedClassroomsBySlot);
  // console.log("Grouped Subdivisions: ", groupedSubdivisionsBySlot);
  // console.log(
  //   "Grouped Subdivisions with Elective: ",
  //   groupedSubdivisionsWithElectiveBySlot,
  // );
  console.log("DB Based Teacher Groups: ", dbBasedGroupedTeachersBySlot);

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

export function useGroupedTeachersBySlot() {
  const { completeLectureOnlyCollection } = useCollections();

  const { data = [] } = useLiveQuery((q) =>
    q.from({ completeLectureOnlyCollection }),
  );

  const grouped: {
    [slotId: string]: {
      [teacherId: string]: string[]; // lectureSlotId
    };
  } = {};

  for (const row of data) {
    const slotId = row.slotId;
    const teacherId = row.teacherId;
    const lectureSlotId = row.lectureSlotId;

    grouped[slotId] ??= {};
    grouped[slotId][teacherId] ??= [];
    grouped[slotId][teacherId].push(lectureSlotId);
  }

  return grouped;
}

export function useGroupedClassroomsBySlot() {
  const { lectureWithClassroomCollection } = useCollections();

  const { data = [] } = useLiveQuery((q) =>
    q.from({ lectureWithClassroomCollection }),
  );

  const grouped: {
    [slotId: string]: {
      [classroomId: string]: string[]; // lectureSlotId
    };
  } = {};

  for (const row of data) {
    const slotId = row.completeLectureOnly.slotId;
    const lectureSlotId = row.completeLectureOnly.lectureSlotId;
    const classroomId = row.lectureClassroom?.classroomId;
    if (!classroomId) continue;

    grouped[slotId] ??= {};
    grouped[slotId][classroomId] ??= [];
    grouped[slotId][classroomId].push(lectureSlotId);
  }

  return grouped;
}

export function useGroupedSubdivisionsBySlot() {
  const { lectureWithSubdivisionCollection } = useCollections();

  const { data = [] } = useLiveQuery((q) =>
    q.from({ lectureWithSubdivisionCollection }),
  );

  const grouped: {
    [slotId: string]: {
      [subdivisionId: string]: string[]; // lectureSlotId
    };
  } = {};

  for (const row of data) {
    const slotId = row.completeLectureOnly.slotId;
    const lectureSlotId = row.completeLectureOnly.lectureSlotId;
    const subdivisionId = row.lectureSubdivision?.subdivisionId;
    if (!subdivisionId) continue;

    grouped[slotId] ??= {};
    grouped[slotId][subdivisionId] ??= [];
    grouped[slotId][subdivisionId].push(lectureSlotId);
  }

  return grouped;
}

export function useGroupedSubdivisionsWithElectiveBySlot() {
  const { lectureWithSubdivisionCollection } = useCollections();

  const { data = [] } = useLiveQuery((q) =>
    q.from({ lectureWithSubdivisionCollection }),
  );

  const grouped: {
    [slotId: string]: {
      [subdivisionId: string]: {
        false: string[]; // lectureSlotId
        true: {
          [groupId: string]: string[]; // lectureSlotId
        };
      };
    };
  } = {};

  for (const row of data) {
    const slotId = row.completeLectureOnly.slotId;
    const lectureSlotId = row.completeLectureOnly.lectureSlotId;
    const subdivisionId = row.lectureSubdivision?.subdivisionId;
    const allowSimultaneous = row.completeLectureOnly.allowSimultaneous;
    const groupId = row.completeLectureOnly.groupId;

    if (!subdivisionId) continue;

    grouped[slotId] ??= {};
    const slotEntry = grouped[slotId];
    slotEntry[subdivisionId] ??= { false: [], true: {} };

    if (allowSimultaneous) {
      slotEntry[subdivisionId].true[groupId] ??= [];
      slotEntry[subdivisionId].true[groupId].push(lectureSlotId);
    } else {
      slotEntry[subdivisionId].false.push(lectureSlotId);
    }
  }

  return grouped;
}

export function useDbBasedGroupedTeachersBySlot() {
  const { completeLectureOnlyCollection } = useCollections();

  const { data } = useLiveQuery((q) => {
    const conflicted = q
      .from({ comp: completeLectureOnlyCollection })
      .groupBy(({ comp }) => [
        comp.slotId,
        comp.teacherId,
        concat(comp.slotId, ":", comp.teacherId),
      ])
      .select(({ comp }) => ({
        slotId: comp.slotId,
        teacherId: comp.teacherId,
        key: concat(comp.slotId, ":", comp.teacherId), // composite join key
        lectureSlotCount: count(comp.lectureSlotId),
      }))
      .having(({ comp }) => gt(count(comp.lectureSlotId), 1));

    return q
      .from({ comp: completeLectureOnlyCollection })
      .innerJoin({ conflicted }, ({ comp, conflicted: conf }) =>
        eq(conf.key, concat(comp.slotId, ":", comp.teacherId)),
      )
      .select(({ comp }) => ({ ...comp })); // NOTE: This needs to be spread, otherwise returns empty object
  });

  // console.log(data);

  const grouped: {
    [slotId: string]: {
      [teacherId: string]: string[]; // lectureSlotId
    };
  } = {};

  for (const row of data) {
    const slotId = row.slotId;
    const teacherId = row.teacherId;
    const lectureSlotId = row.lectureSlotId;

    grouped[slotId] ??= {};
    grouped[slotId][teacherId] ??= [];
    grouped[slotId][teacherId].push(lectureSlotId);
  }

  return grouped;
}
