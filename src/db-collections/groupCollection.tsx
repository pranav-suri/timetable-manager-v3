import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { GroupSchema } from "generated/zod";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getGroupCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const groupCollection = createCollection(
    queryCollectionOptions({
      id: "group:" + timetableId,
      startSync: true,
      schema: GroupSchema,
      queryKey: trpc.groups.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { groups } = await trpcClient.groups.list.query({
          timetableId,
        });
        return groups;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.groups.add.mutate(modified);
        // return { refetch: false };
      },
      onUpdate: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.groups.update.mutate(modified);
        // return { refetch: false };
      },
      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.groups.delete.mutate({
          id: original.id,
        });
        // return { refetch: false };
      },
    }),
  );

  return groupCollection;
}
