import { createOptimisticAction } from "@tanstack/react-db";
import { useCollections } from "./providers/useCollections";
import type { trpcClient } from "@/integrations/trpc";
import { useTRPCClient } from "@/integrations/trpc";

export type MutationInput<T> = T extends {
  mutate: (input: infer I, ...args: any[]) => any;
}
  ? I
  : unknown;

/** Arguments for inserting lecture */
export type InsertLectureParams = Required<
  MutationInput<typeof trpcClient.autoLectures.add>
>;

/** Arguments for updating lecture */
export type UpdateLectureParams = Required<
  MutationInput<typeof trpcClient.autoLectures.update>
>;

/**
 * A hook that provides a function to insert a lecture and its related data
 * in a single transaction.
 * {@returns} A function that takes lecture details and performs the transaction.
 */
export function useLectureInsert() {
  const {
    lectureCollection,
    lectureClassroomCollection,
    lectureSubdivisionCollection,
  } = useCollections();
  const trpcClient = useTRPCClient();

  const insertLecture = createOptimisticAction<InsertLectureParams>({
    onMutate: (input) => {
      lectureCollection.insert({
        id: input.id,
        timetableId: input.timetableId,
        teacherId: input.teacherId,
        subjectId: input.subjectId,
        duration: input.duration,
        count: input.count,
        createdAt: new Date(),
      });
    },
    mutationFn: async (input) => {
      await trpcClient.autoLectures.add.mutate({
        ...input,
      });
      await Promise.all([
        lectureCollection.utils.refetch(),
        lectureClassroomCollection.utils.refetch(),
        lectureSubdivisionCollection.utils.refetch(),
      ]);
    },
  });
  return insertLecture;
}

/**
 * A hook that provides a function to update a lecture and its related data
 * in a single transaction.
 * {@returns} A function that takes lecture details and performs the transaction.
 */
export function useLectureUpdate() {
  const {
    lectureCollection,
    lectureClassroomCollection,
    lectureSubdivisionCollection,
  } = useCollections();
  const trpcClient = useTRPCClient();

  const updateLecture = createOptimisticAction<UpdateLectureParams>({
    onMutate: (input) => {
      lectureCollection.update(input.id, (draft) => {
        draft.count = input.count;
        draft.teacherId = input.teacherId;
        draft.subjectId = input.subjectId;
        draft.duration = input.duration;
        draft.createdAt = new Date(); // TODO: Change to updateAt, mutation function only triggers if there is a change in the collections
      });

      // TODO: Optimistically handle lectureSubdivision and lectureClassroom
    },

    mutationFn: async (input) => {
      await trpcClient.autoLectures.update.mutate({
        ...input,
      });
      await Promise.all([
        lectureCollection.utils.refetch(),
        lectureClassroomCollection.utils.refetch(),
        lectureSubdivisionCollection.utils.refetch(),
      ]);
    },
  });

  return updateLecture;
}
