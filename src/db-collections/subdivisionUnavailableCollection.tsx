import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { SubdivisionUnavailableSchema } from "generated/zod";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getSubdivisionUnavailableCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const subdivisionUnavailableCollection = createCollection(
    queryCollectionOptions({
      id: "subdivisionUnavailable:" + timetableId,
      startSync: true,
      schema: SubdivisionUnavailableSchema,
      queryKey: trpc.subdivisionUnavailabilities.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { subdivisionUnavailables } =
          await trpcClient.subdivisionUnavailabilities.list.query({
            timetableId,
          });
        return subdivisionUnavailables;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.subdivisionUnavailabilities.add.mutate({
          ...modified,
          timetableId,
        });
        // return { refetch: false };
      },

      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.subdivisionUnavailabilities.delete.mutate({
          id: original.id,
          timetableId,
        });
        // return { refetch: false };
      },
    }),
  );

  return subdivisionUnavailableCollection;
}
