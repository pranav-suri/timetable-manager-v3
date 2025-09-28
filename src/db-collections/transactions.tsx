import { createTransaction } from "@tanstack/react-db";
import { useCollections } from "./providers/useCollections";
import type { trpcClient } from "@/integrations/trpc";
import { useTRPCClient } from "@/integrations/trpc";

export type MutationInput<T> = T extends {
  mutate: (input: infer I, ...args: any[]) => any;
}
  ? I
  : unknown;

/** Arguments for updating lecture */
export type InsertLectureParams = Required<
  Omit<MutationInput<typeof trpcClient.autoLectures.add>, "slotIds">
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

  const insertLecture = (input: InsertLectureParams) => {
    const tx = createTransaction({
      mutationFn: async () => {
        await trpcClient.autoLectures.add.mutate({
          ...input,
        });
      },
    });

    const newLectureTransaction = tx.mutate(async () => {
      const insertTransaction = lectureCollection.insert({
        id: input.id,
        timetableId: input.timetableId,
        teacherId: input.teacherId,
        subjectId: input.subjectId,
        duration: input.duration,
        count: input.count,
        createdAt: new Date(),
      });
      await insertTransaction.isPersisted.promise;
      lectureCollection.utils.refetch();
      lectureClassroomCollection.utils.refetch();
      lectureSubdivisionCollection.utils.refetch();
      console.log("Lecture Inserted");
    });

    return newLectureTransaction;
  };

  return insertLecture;
}
