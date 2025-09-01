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
import { CollectionsContext } from "./CollectionsContext";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTRPC, useTRPCClient } from "@/integrations/trpc";
import { Route as TimetableRoute } from "@/routes/timetable/$timetableId/route";

export type CollectionInput = {
  timetableId: string;
  queryClient: QueryClient;
  trpcClient: ReturnType<typeof useTRPCClient>;
  trpc: ReturnType<typeof useTRPC>;
};

export type CollectionsContextType = ReturnType<typeof getCollections>;

function useTimetableId() {
  const { timetableId } = TimetableRoute.useParams();
  return timetableId;
}

function getCollections() {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const timetableId = useTimetableId();

  const input = {
    timetableId,
    queryClient,
    trpcClient,
    trpc,
  } satisfies CollectionInput;

  // Add more collections to this object as needed
  const collections = {
    classroomCollection: getClassroomCollection(input),
    groupCollection: getGroupCollection(input),
    lectureCollection: getLectureCollection(input),
    lectureClassroomCollection: getLectureClassroomCollection(input),
    lectureSubdivisionCollection: getLectureSubdivisionCollection(input),
    slotCollection: getSlotCollection(input),
    subdivisionCollection: getSubdivisionCollection(input),
    subjectCollection: getSubjectCollection(input),
    teacherCollection: getTeacherCollection(input),
  };

  console.log("Collection Objects Created");
  return collections;
}

export function CollectionsProvider({ children }: { children: ReactNode }) {
  return (
    <CollectionsContext.Provider value={getCollections()}>
      {children}
    </CollectionsContext.Provider>
  );
}
