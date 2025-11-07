import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getSubdivisionGroupTempCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const subdivisionGroupTempCollection = createCollection(
    queryCollectionOptions({
      id: "subdivisionGroupTemp:" + timetableId,
      startSync: true,
      queryKey: trpc.subdivisionGroupTemp.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { subdivisionGroupTemp } =
          await trpcClient.subdivisionGroupTemp.list.query({
            timetableId,
          });
        return subdivisionGroupTemp;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: () => {
        throw new Error("Not implemented");
      },
      onUpdate: () => {
        throw new Error("Not implemented");
      },
      onDelete: () => {
        throw new Error("Not implemented");
      },
    }),
  );

  return subdivisionGroupTempCollection;
}
