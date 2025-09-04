import { createFileRoute } from "@tanstack/react-router";
import {
  createCollection,
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
const DemoMemoized = memo(Demo);

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
  const { timetableCollection, lectureCollection } = useCollections();
  const { data: ttJoined } = useLiveQuery((q) =>
    q
      .from({ tt: timetableCollection })
      .where(({ tt }) => not(eq(tt.id, "")))
      .innerJoin({ lecture: lectureCollection }, ({ lecture, tt }) =>
        eq(lecture.timetableId, tt.id),
      ),
  );

  console.log(ttJoined);
  const { data: subset } = useLiveQuery((q) =>
    q
      .from({ tt: timetableCollection })
      .orderBy(({ tt }) => tt.id, "asc")
      .limit(150),
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

  console.log("rendered");
  // console.log("Collection", timetableCollection);
  // const { data: timetables } = useLiveQuery(
  //   (q) => q.from({ timetableCollection }),
  // .where(({lectureClassroom}) => eq(lectureClassroom.id, "time")),
  // );
  // console.log("Timetables from collection:", subset);
  return (
    <div>
      <button onClick={handleClick}>Click me</button>
      <br />
      Hello "/timetable/$timetableId/sdakjladsvj"!
      <br />
      <Demo input={subset[subset.length - 1]?.id} />
    </div>
  );
}
