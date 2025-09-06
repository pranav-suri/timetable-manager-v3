import { Outlet, createFileRoute } from "@tanstack/react-router";
import { CollectionsProvider } from "@/db-collections/providers/CollectionProvider";

export const Route = createFileRoute("/tt/$timetableId")({
  component: RouteComponent,
  ssr: false,
});

function RouteComponent() {
  const { timetableId } = Route.useParams();
  return (
    <CollectionsProvider timetableId={timetableId}>
      <Outlet />
    </CollectionsProvider>
  );
}
