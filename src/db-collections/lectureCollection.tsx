import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getLectureCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const lectureCollection = createCollection(
    queryCollectionOptions({
      id: "lecture:" + timetableId,
      startSync: true,
      queryKey: trpc.lectures.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { lectures } = await trpcClient.lectures.list.query({
          timetableId,
        });
        return lectures;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.lectures.add.mutate(modified);
      },

      onUpdate: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.lectures.update.mutate(modified);
      },

      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.lectures.delete.mutate({
          id: original.id,
        });
        // Invalidation done to refetch lectureClassrooms and lectureSubdivisions
        // TODO: Optimize this to only refetch the above 2 collections
      },
    }),
  );

  return lectureCollection;
}
