import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { getTeacherCollection } from "../teacherCollection";
import { getSubjectCollection } from "../subjectCollection";
import { getGroupCollection } from "../groupCollection";
import { getClassroomCollection } from "../classroomCollection";
import { getSubdivisionCollection } from "../subdivisionCollection";
import { getSlotCollection } from "../slotCollection";
import { getLectureCollection } from "../lectureCollection";
import { getLectureSubdivisionCollection } from "../lectureSubdivisionCollection";
import { getLectureClassroomCollection } from "../lectureClassroomCollection";
import { getLectureSlotCollection } from "../lectureSlotCollection";
import { getSubjectClassroomCollection } from "../subjectClassroomCollection";
import { getSubjectTeacherCollection } from "../subjectTeacherCollection";
import { getTimetableCollection } from "../timetableCollection";
import { getClassroomUnavailableCollection } from "../classroomUnavailableCollection";
import { getTeacherUnavailableCollection } from "../teacherUnavailableCollection";
import { getSubdivisionUnavailableCollection } from "../subdivisionUnavailableCollection";
import { CollectionsContext } from "./CollectionsContext";
import type { ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/integrations/trpc";

export type CollectionInput = {
  timetableId: string;
  queryClient: QueryClient;
  trpcClient: ReturnType<typeof useTRPCClient>;
  trpc: ReturnType<typeof useTRPC>;
};

export type CollectionsContextType = ReturnType<typeof getCollections>;

function getCollections(input: CollectionInput) {
  const { trpc, queryClient, trpcClient } = input;
  // Add more collections to this object as needed
  const collections = {
    classroomCollection: getClassroomCollection(input),
    classroomUnavailableCollection: getClassroomUnavailableCollection(input),
    groupCollection: getGroupCollection(input),
    lectureCollection: getLectureCollection(input),
    lectureClassroomCollection: getLectureClassroomCollection(input),
    lectureSlotCollection: getLectureSlotCollection(input),
    lectureSubdivisionCollection: getLectureSubdivisionCollection(input),
    slotCollection: getSlotCollection(input),
    subdivisionCollection: getSubdivisionCollection(input),
    subdivisionUnavailableCollection:
      getSubdivisionUnavailableCollection(input),
    subjectCollection: getSubjectCollection(input),
    subjectClassroomCollection: getSubjectClassroomCollection(input),
    subjectTeacherCollection: getSubjectTeacherCollection(input),
    teacherCollection: getTeacherCollection(input),
    teacherUnavailableCollection: getTeacherUnavailableCollection(input),
    timetableCollection: getTimetableCollection({
      queryClient,
      trpcClient,
      trpc,
    }),
  };

  console.log("Collection Objects Created");
  return collections;
}

export function CollectionsProvider({
  timetableId,
  children,
}: {
  timetableId: string;
  children: ReactNode;
}) {
  const ref = useRef<CollectionsContextType>(null);
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();

  if (!ref.current)
    ref.current = getCollections({
      trpc,
      trpcClient,
      queryClient,
      timetableId,
    });

  return (
    <CollectionsContext.Provider value={ref.current}>
      {children}
    </CollectionsContext.Provider>
  );
}
