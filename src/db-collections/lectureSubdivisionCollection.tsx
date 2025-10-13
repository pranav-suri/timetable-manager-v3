import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getLectureSubdivisionCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const lectureSubdivisionCollection = createCollection(
    queryCollectionOptions({
      id: "lectureSubdivision:" + timetableId,
      startSync: true,
      queryKey: trpc.lectureSubdivisions.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { lectureSubdivisions } =
          await trpcClient.lectureSubdivisions.list.query({
            timetableId,
          });
        return lectureSubdivisions;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.lectureSubdivisions.add.mutate({
          ...modified,
          timetableId,
        });
        // return { refetch: false };
      },
      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.lectureSubdivisions.delete.mutate({
          id: original.id,
          timetableId,
        });
        // return { refetch: false };
      },
    }),
  );

  return lectureSubdivisionCollection;
}
