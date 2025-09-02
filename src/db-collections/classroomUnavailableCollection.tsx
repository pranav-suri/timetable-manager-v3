import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getClassroomUnavailableCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const classroomUnavailableCollection = createCollection(
    queryCollectionOptions({
      queryKey: trpc.classroomUnavailabilities.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { classroomUnavailables } =
          await trpcClient.classroomUnavailabilities.list.query({
            timetableId,
          });
        return classroomUnavailables;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.classroomUnavailabilities.add.mutate(modified);
        // return { refetch: false };
      },

      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.classroomUnavailabilities.delete.mutate({
          id: original.id,
        });
        // return { refetch: false };
      },
    }),
  );

  return classroomUnavailableCollection;
}
