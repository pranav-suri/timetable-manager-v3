import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getLectureCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const lectureCollection = createCollection(
    queryCollectionOptions({
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
        // return { refetch: false };
      },

      onUpdate: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.lectures.update.mutate(modified);
        // return { refetch: false };
      },
      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.lectures.delete.mutate({
          id: original.id,
        });
        queryClient.invalidateQueries();
        // return { refetch: false };
      },
    }),
  );

  return lectureCollection;
}
