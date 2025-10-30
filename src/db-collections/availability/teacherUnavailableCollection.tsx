// Collection for TeacherUnavailable constraints
// Provides CRUD operations and hooks for teacher availability

import { useQuery } from "@tanstack/react-query";

export const useTeacherUnavailableCollection = (
  timetableId: string,
  trpcClient: any,
) => {
  return useQuery({
    queryKey: ["teacherUnavailables", timetableId],
    queryFn: async () => {
      const { teacherUnavailables } =
        await trpcClient.teacherUnavailabilities.list.query({ timetableId });
      return teacherUnavailables;
    },
  });
};
