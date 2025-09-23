import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getSubjectClassroomCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const subjectClassroomCollection = createCollection(
    queryCollectionOptions({
      id: "subjectClassroom:" + timetableId,
      startSync: true,
      queryKey: trpc.subjectClassrooms.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { subjectClassrooms } =
          await trpcClient.subjectClassrooms.list.query({
            timetableId,
          });
        return subjectClassrooms;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.subjectClassrooms.add.mutate(modified);
        // return { refetch: false };
      },

      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.subjectClassrooms.delete.mutate({
          id: original.id,
        });
        // return { refetch: false };
      },
    }),
  );

  return subjectClassroomCollection;
}
