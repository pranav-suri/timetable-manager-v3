import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getLectureClassroomCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const lectureClassroomCollection = createCollection(
    queryCollectionOptions({
      id: "lectureClassroom:" + timetableId,
      startSync: true,
      queryKey: trpc.lectureClassrooms.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { lectureClassrooms } =
          await trpcClient.lectureClassrooms.list.query({
            timetableId,
          });
        return lectureClassrooms;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.lectureClassrooms.add.mutate({
          ...modified,
          timetableId,
        });
        // return { refetch: false };
      },
      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.lectureClassrooms.delete.mutate({
          id: original.id,
          timetableId,
        });
        // return { refetch: false };
      },
    }),
  );

  return lectureClassroomCollection;
}
