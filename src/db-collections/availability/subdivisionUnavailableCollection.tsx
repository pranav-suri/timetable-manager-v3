// Collection for SubdivisionUnavailable constraints
// Provides CRUD operations and hooks for subdivision availability

import { useQuery } from "@tanstack/react-query";

export const useSubdivisionUnavailableCollection = (
  timetableId: string,
  trpcClient: any,
) => {
  return useQuery({
    queryKey: ["subdivisionUnavailables", timetableId],
    queryFn: async () => {
      const { subdivisionUnavailables } =
        await trpcClient.subdivisionUnavailabilities.list.query({
          timetableId,
        });
      return subdivisionUnavailables;
    },
  });
};
