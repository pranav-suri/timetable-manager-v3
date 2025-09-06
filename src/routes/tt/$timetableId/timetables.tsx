import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tt/$timetableId/timetables")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/tt/$timetableId/timetables"!</div>;
}
