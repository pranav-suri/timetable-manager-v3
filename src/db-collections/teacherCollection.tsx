import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { TeacherSchema } from "generated/zod";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getTeacherCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const teacherCollection = createCollection(
    queryCollectionOptions({
      id: "teacher:" + timetableId,
      startSync: true,
      schema: TeacherSchema,
      queryKey: trpc.teachers.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { teachers } = await trpcClient.teachers.list.query({
          timetableId,
        });
        return teachers;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.teachers.add.mutate({ ...modified, timetableId });
      },

      onUpdate: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.teachers.update.mutate(modified);
      },

      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.teachers.delete.mutate({
          id: original.id,
        });
      },
    }),
  );

  return teacherCollection;
}
