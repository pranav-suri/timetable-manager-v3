import { useQueryClient } from "@tanstack/react-query";
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
import { getLiveCollections } from "../liveCollections";
import { getGenerationConfigCollection } from "../generationConfigCollection";
import { CollectionsContext } from "./CollectionsContext";
import type { ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useTRPC, useTRPCClient } from "@/integrations/trpc";
import { getSubdivisionGroupTempCollection } from "../subdivisionGroupTemp";

export type CollectionInput = {
  timetableId: string;
  queryClient: QueryClient;
  trpcClient: ReturnType<typeof useTRPCClient>;
  trpc: ReturnType<typeof useTRPC>;
};

export type CollectionsContextType = ReturnType<typeof getCollections>;

function getCollections(input: CollectionInput) {
  const { trpc, queryClient, trpcClient } = input;
  // console.log("Query Client Cache Size before clearing:", queryClient.getQueryCache().getAll().length);
  // UNCOMMENTING BELOW CODE prevents Cannot update a component (`RouteComponent`) while rendering a different component
  // queryClient.clear(); // NA: Old versoin bug. Clear the cache to avoid bug with switching timetabless
  // Add more collections to this object as needed
  const collections = {
    classroomCollection: getClassroomCollection(input),
    classroomUnavailableCollection: getClassroomUnavailableCollection(input),
    generationConfigCollection: getGenerationConfigCollection(input),
    groupCollection: getGroupCollection(input),
    lectureCollection: getLectureCollection(input),
    lectureClassroomCollection: getLectureClassroomCollection(input),
    lectureSlotCollection: getLectureSlotCollection(input),
    lectureSubdivisionCollection: getLectureSubdivisionCollection(input),
    slotCollection: getSlotCollection(input),
    subdivisionCollection: getSubdivisionCollection(input),
    subdivisionGroupTempCollection: getSubdivisionGroupTempCollection(input),
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

  const liveCollections = getLiveCollections({
    timetableId: input.timetableId,
    groupCollection: collections.groupCollection,
    lectureCollection: collections.lectureCollection,
    lectureSlotCollection: collections.lectureSlotCollection,
    subjectCollection: collections.subjectCollection,
    lectureClassroomCollection: collections.lectureClassroomCollection,
    lectureSubdivisionCollection: collections.lectureSubdivisionCollection,
  });

  console.log("Collection Objects Created");
  return { ...collections, ...liveCollections };
}

export function CollectionsProvider({
  timetableId,
  children,
}: {
  timetableId: string;
  children: ReactNode;
}) {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const collections = getCollections({
    trpc,
    trpcClient,
    queryClient,
    timetableId,
  });

  return (
    <CollectionsContext.Provider value={collections}>
      {children}
    </CollectionsContext.Provider>
  );
}
