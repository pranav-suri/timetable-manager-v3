import { eq, or, useLiveQuery } from "@tanstack/react-db";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useCollections } from "@/db-collections/providers/useCollections";

export const Route = createFileRoute("/tt/$timetableId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { timetableCollection } = useCollections();
  const { data: TTs } = useLiveQuery((q) =>
    q
      .from({ tt: timetableCollection })
      .where(({ tt }) => or(eq(tt.name, "ODD"), eq(tt.name, "EVEN"))),
  );
  return (
    <>
      {TTs.map((tt) => (
        <Link to={"/tt/$timetableId/edit"} params={{ timetableId: tt.id }}>
          {tt.name}{" "}
        </Link>
      ))}
    </>
  );
}
