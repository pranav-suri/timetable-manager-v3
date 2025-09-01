import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "@tanstack/react-db";
import { useCollections } from "@/db-collections/providers/useCollections";

export const Route = createFileRoute("/timetable/$timetableId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { lectureClassroomCollection } = useCollections();
  // const { data: teachers } = useLiveQuery((q) =>
  //   q.from({ teacher: teacherCollection }),
  // );
  // console.log("Teachers from collection:", teachers);
  const { data: lectureClassrooms } = useLiveQuery((q) =>
    q.from({ lectureClassroom: lectureClassroomCollection }),
  );
  console.log("Lecture Classrooms from collection:", lectureClassrooms);

  return <div>Hello "/timetable/$timetableId/sdakjladsvj"!</div>;
}
