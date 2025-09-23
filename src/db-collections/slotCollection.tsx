import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getSlotCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const slotCollection = createCollection(
    queryCollectionOptions({
      id: "slot:" + timetableId,
      startSync: true,
      queryKey: trpc.slots.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { slots } = await trpcClient.slots.list.query({
          timetableId,
        });
        return slots;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.slots.add.mutate(modified);
        // return { refetch: false };
      },

      onUpdate: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.slots.update.mutate(modified);
        // return { refetch: false };
      },
      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.slots.delete.mutate({
          id: original.id,
        });
        // return { refetch: false };
      },
    }),
  );

  return slotCollection;
}
