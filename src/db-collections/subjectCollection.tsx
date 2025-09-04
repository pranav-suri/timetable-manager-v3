import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getSubjectCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const subjectCollection = createCollection(
    queryCollectionOptions({
      startSync: true,
      queryKey: trpc.subjects.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { subjects } = await trpcClient.subjects.list.query({
          timetableId,
        });
        return subjects;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.subjects.add.mutate({ ...modified, timetableId });
        // return { refetch: false };
      },

      onUpdate: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.subjects.update.mutate(modified);
        // return { refetch: false };
      },
      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.subjects.delete.mutate({
          id: original.id,
        });
        // return { refetch: false };
      },
    }),
  );

  return subjectCollection;
}
