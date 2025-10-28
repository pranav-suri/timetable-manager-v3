import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { ClassroomUnavailableSchema } from "generated/zod";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getClassroomUnavailableCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const classroomUnavailableCollection = createCollection(
    queryCollectionOptions({
      id: "classroomUnavailable:" + timetableId,
      startSync: true,
      schema: ClassroomUnavailableSchema,
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
        await trpcClient.classroomUnavailabilities.add.mutate({
          ...modified,
          timetableId,
        });
        // return { refetch: false };
      },

      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.classroomUnavailabilities.delete.mutate({
          id: original.id,
          timetableId,
        });
        // return { refetch: false };
      },
    }),
  );

  return classroomUnavailableCollection;
}
