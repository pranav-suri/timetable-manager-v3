import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import type { CollectionInput } from "./providers/CollectionProvider";
import type { PartialGAConfig } from "@/server/services/timetableGenerator/types";

export interface GenerationConfigWithMeta {
  id: string;
  timetableId: string;
  config: PartialGAConfig;
  createdAt: Date;
  updatedAt: Date;
}

export function getGenerationConfigCollection({
  timetableId,
  queryClient,
  trpcClient,
  trpc,
}: CollectionInput) {
  const generationConfigCollection = createCollection(
    queryCollectionOptions({
      id: "generationConfig:" + timetableId,
      startSync: true,
      queryKey: trpc.generationConfig.get.queryKey({ timetableId }),
      queryFn: async () => {
        const result = await trpcClient.generationConfig.get.query({
          timetableId,
        });
        return result.generationConfig ? [result.generationConfig] : [];
      },
      queryClient,
      getKey: (item) => item.id,

      onUpdate: async ({ transaction }) => {
        const { modified } = transaction.mutations[0];
        await trpcClient.generationConfig.save.mutate({
          timetableId,
          config: modified.config,
        });
      },
    }),
  );

  return generationConfigCollection;
}
