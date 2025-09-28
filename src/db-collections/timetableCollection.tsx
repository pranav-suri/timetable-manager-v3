import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { TimetableSchema } from "generated/zod";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getTimetableCollection({
  queryClient,
  trpcClient,
  trpc,
}: Omit<CollectionInput, "timetableId">) {
  const timetableCollection = createCollection(
    queryCollectionOptions({
      id: "timetable",
      startSync: true,
      schema: TimetableSchema,
      queryKey: trpc.timetable.list.queryKey(),
      queryFn: async () => {
        const { timetables } = await trpcClient.timetable.list.query();
        return timetables;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.timetable.add.mutate(modified);
        // return { refetch: false };
      },

      onUpdate: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.timetable.update.mutate(modified);
        // return { refetch: false };
      },
      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.timetable.delete.mutate({
          id: original.id,
        });
        // return { refetch: false };
      },
    }),
  );
  return timetableCollection;
}
