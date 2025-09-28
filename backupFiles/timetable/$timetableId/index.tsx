import { createFileRoute } from "@tanstack/react-router";
import { eq, not, useLiveQuery } from "@tanstack/react-db";
import { nanoid } from "nanoid";
import { Demo } from "./-demo";
import {
  useGroupedClassroomsBySlot,
  useGroupedSubdivisionsBySlot,
  useGroupedSubdivisionsWithoutElectiveBySlot,
  useGroupedTeachersBySlot,
  useSubset,
} from "./-demoHooks";
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
  const groupedSubdivisionsWithoutElectiveBySlot =
    useGroupedSubdivisionsWithoutElectiveBySlot();
  // const dbBasedGroupedTeachersBySlot = useDbBasedGroupedTeachersBySlot();

  console.log("Grouped Teachers: ", groupedTeachersBySlot);
  console.log("Grouped Classrooms: ", groupedClassroomsBySlot);
  console.log("Grouped Subdivisions: ", groupedSubdivisionsBySlot);
  console.log(
    "Grouped Subdivisions without Elective: ",
    groupedSubdivisionsWithoutElectiveBySlot,
  );
  // console.log("DB Based Teacher Groups: ", dbBasedGroupedTeachersBySlot);

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
