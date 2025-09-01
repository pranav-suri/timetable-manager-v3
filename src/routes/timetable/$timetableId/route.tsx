import { Outlet, createFileRoute } from "@tanstack/react-router";
import { CollectionsProvider } from "@/db-collections/providers/CollectionProvider";

export const Route = createFileRoute("/timetable/$timetableId")({
  component: RouteComponent,
  ssr: false, // We are using tanstack db, it does not support server rendering
});

function RouteComponent() {
  return (
    <CollectionsProvider>
      <div>Hello "/timetable/$timetableId"!</div>
      <Outlet />
      <div>Hello "/timetable/$timetableId/blah blah"!</div>
    </CollectionsProvider>
  );
}
