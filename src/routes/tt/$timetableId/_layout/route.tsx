import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCollections } from "@/db-collections/providers/useCollections";

export const Route = createFileRoute("/tt/$timetableId/_layout")({
  component: RouteComponent,
});

function RouteComponent() {
  const [allCollectionsReady, setAllCollectionsReady] =
    useState<boolean>(false);

  const collections = useCollections();
  useEffect(() => {
    const checkReady = async () => {
      for (const col of Object.values(collections)) {
        col.preload();
        await col.stateWhenReady();
      }
      setAllCollectionsReady(true);
    };
    checkReady();
  }, [collections]);

  if (!allCollectionsReady) return <>Loading Collections.</>;
  return (
    <>
      <Outlet />
    </>
  );
}
