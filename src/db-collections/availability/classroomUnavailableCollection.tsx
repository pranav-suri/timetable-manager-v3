// Collection for ClassroomUnavailable constraints
// Provides CRUD operations and hooks for classroom availability

import { useQuery } from "@tanstack/react-query";

export const useClassroomUnavailableCollection = (
  timetableId: string,
  trpcClient: any,
) => {
  return useQuery({
    queryKey: ["classroomUnavailables", timetableId],
    queryFn: async () => {
      const { classroomUnavailables } =
        await trpcClient.classroomUnavailabilities.list.query({ timetableId });
      return classroomUnavailables;
    },
  });
};
