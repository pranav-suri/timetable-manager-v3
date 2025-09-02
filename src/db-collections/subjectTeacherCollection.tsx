import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getSubjectTeacherCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const subjectTeacherCollection = createCollection(
    queryCollectionOptions({
      queryKey: trpc.subjectTeachers.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { subjectTeachers } = await trpcClient.subjectTeachers.list.query(
          { timetableId },
        );
        return subjectTeachers;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.subjectTeachers.add.mutate(modified);
        // return { refetch: false };
      },

      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.subjectTeachers.delete.mutate({
          id: original.id,
        });
        // return { refetch: false };
      },
    }),
  );

  return subjectTeacherCollection;
}
