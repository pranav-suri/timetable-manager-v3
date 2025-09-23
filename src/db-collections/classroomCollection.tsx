import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getClassroomCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const classroomCollection = createCollection(
    queryCollectionOptions({
      id: "classroom:" + timetableId,
      startSync: true,
      queryKey: trpc.classrooms.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { classrooms } = await trpcClient.classrooms.list.query({
          timetableId,
        });
        return classrooms;
      },
      queryClient,
      getKey: (item) => item.id,
      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.classrooms.add.mutate(modified);
        // return { refetch: false };
      },
      onUpdate: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.classrooms.update.mutate(modified);
        // return { refetch: false };
      },
      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.classrooms.delete.mutate({
          id: original.id,
        });
        // return { refetch: false };
      },
    }),
  );

  return classroomCollection;
}
