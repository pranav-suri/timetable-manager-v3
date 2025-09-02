import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getTeacherUnavailableCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const teacherUnavailableCollection = createCollection(
    queryCollectionOptions({
      queryKey: trpc.teacherUnavailabilities.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { teacherUnavailables } =
          await trpcClient.teacherUnavailabilities.list.query({
            timetableId,
          });
        return teacherUnavailables;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.teacherUnavailabilities.add.mutate(modified);
        // return { refetch: false };
      },

      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.teacherUnavailabilities.delete.mutate({
          id: original.id,
        });
        // return { refetch: false };
      },
    }),
  );

  return teacherUnavailableCollection;
}
