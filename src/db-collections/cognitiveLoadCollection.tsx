// Collection for cognitive load tracking
// Provides a query-based collection for teacher cognitive load data

import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/db";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getCognitiveLoadCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const cognitiveLoadCollection = createCollection(
    queryCollectionOptions({
      id: "cognitiveLoad:" + timetableId,
      startSync: true,
      queryKey: trpc.cognitiveLoad.getTeacherLoads.queryKey({ timetableId }),
      queryFn: async () => {
        const { cognitiveLoads } =
          await trpcClient.cognitiveLoad.getTeacherLoads.query({
            timetableId,
          });
        return cognitiveLoads;
      },
      queryClient,
      getKey: (item) => item.teacherId,
      // Cognitive load is read-only (computed), so no mutation handlers needed
    }),
  );

  return cognitiveLoadCollection;
}
