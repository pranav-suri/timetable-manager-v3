import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { SubdivisionSchema } from "generated/zod";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getSubdivisionCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const subdivisionCollection = createCollection(
    queryCollectionOptions({
      id: "subdivision:" + timetableId,
      startSync: true,
      schema: SubdivisionSchema,
      queryKey: trpc.subdivisions.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { subdivisions } = await trpcClient.subdivisions.list.query({
          timetableId,
        });
        return subdivisions;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.subdivisions.add.mutate(modified);
        // return { refetch: false };
      },

      onUpdate: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.subdivisions.update.mutate(modified);
        // return { refetch: false };
      },
      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.subdivisions.delete.mutate({
          id: original.id,
        });
        // return { refetch: false };
      },
    }),
  );

  return subdivisionCollection;
}
