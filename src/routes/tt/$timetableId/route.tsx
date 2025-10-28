/**
 * This file provides access to collections for all its child routes.
 * It doesn't wrap tt/index.tsx, which is used for listing all timetables.
 * This is because collections are tied to a specific timetable.
 */
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CollectionsProvider } from "@/db-collections/providers/CollectionProvider";
import { useCollections } from "@/db-collections/providers/useCollections";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/tt/$timetableId")({
  component: () => (
    <RequireAuth>
      <RouteComponent />
    </RequireAuth>
  ),
  ssr: false,
});

function RouteComponent() {
  const { timetableId } = Route.useParams();
  return (
    <CollectionsProvider timetableId={timetableId}>
      <CollectionsLoader />
    </CollectionsProvider>
  );
}

// Define a new component that handles the loading state
function CollectionsLoader() {
  const [allCollectionsReady, setAllCollectionsReady] =
    useState<boolean>(false);

  // This hook must be called inside the CollectionsProvider,
  // which is in the parent RouteComponent.
  const collections = useCollections();

  useEffect(() => {
    const checkReady = async () => {
      // Logic from src/routes/tt/$timetableId._loader/route.tsx
      for (const col of Object.values(collections)) {
        col.preload();
        await col.stateWhenReady();
        // console.log(col.id, await col.toArrayWhenReady())
      }
      setAllCollectionsReady(true);
    };
    checkReady();
  }, [collections]);

  if (!allCollectionsReady) return <>Loading Collections.</>;

  // Render the child routes once collections are ready
  return <Outlet />;
}
