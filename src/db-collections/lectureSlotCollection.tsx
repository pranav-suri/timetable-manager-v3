import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { LectureSlotSchema } from "generated/zod";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getLectureSlotCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const lectureSlotCollection = createCollection(
    queryCollectionOptions({
      id: "lectureSlot:" + timetableId,
      startSync: true,
      schema: LectureSlotSchema,
      queryKey: trpc.lectureSlots.list.queryKey({ timetableId }),
      queryFn: async () => {
        const { lectureSlots } = await trpcClient.lectureSlots.list.query({
          timetableId,
        });
        return lectureSlots;
      },
      queryClient,
      getKey: (item) => item.id,

      onInsert: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.lectureSlots.add.mutate({
          ...modified,
          timetableId,
        });
        // return { refetch: false };
      },

      onUpdate: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.lectureSlots.update.mutate({
          ...modified,
          timetableId,
        });
        // return { refetch: false };
      },
      onDelete: async ({ transaction }) => {
        const { original } = transaction.mutations[0];
        await trpcClient.lectureSlots.delete.mutate({
          id: original.id,
          timetableId,
        });
        // return { refetch: false };
      },
    }),
  );

  return lectureSlotCollection;
}
