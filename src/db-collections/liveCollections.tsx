import {
  createCollection,
  eq,
  liveQueryCollectionOptions,
} from "@tanstack/react-db";
import type { getLectureSubdivisionCollection } from "./lectureSubdivisionCollection";
import type { getLectureCollection } from "./lectureCollection";
import type { getLectureSlotCollection } from "./lectureSlotCollection";
import type { getGroupCollection } from "./groupCollection";
import type { getSubjectCollection } from "./subjectCollection";
import type { getLectureClassroomCollection } from "./lectureClassroomCollection";

type GetLiveCollectionsInput = {
  lectureSlotCollection: ReturnType<typeof getLectureSlotCollection>;
  lectureCollection: ReturnType<typeof getLectureCollection>;
  groupCollection: ReturnType<typeof getGroupCollection>;
  subjectCollection: ReturnType<typeof getSubjectCollection>;
  lectureSubdivisionCollection: ReturnType<
    typeof getLectureSubdivisionCollection
  >;
  lectureClassroomCollection: ReturnType<typeof getLectureClassroomCollection>;
};

export function getLiveCollections({
  lectureSlotCollection,
  lectureCollection,
  groupCollection,
  subjectCollection,
  lectureClassroomCollection,
  lectureSubdivisionCollection,
}: GetLiveCollectionsInput) {
  const completeLectureOnlyCollection = createCollection(
    liveQueryCollectionOptions({
      id: "completeLectureOnly",
      query: (q) => {
        const completeLectureWithoutGroup = q
          .from({ lecture: lectureCollection })
          .innerJoin(
            { lectureSlot: lectureSlotCollection },
            ({ lecture, lectureSlot }) => eq(lecture.id, lectureSlot.lectureId),
          )
          .innerJoin({ subject: subjectCollection }, ({ lecture, subject }) =>
            eq(lecture.subjectId, subject.id),
          )
          .select(({ lecture, lectureSlot, subject }) => ({
            lectureSlotId: lectureSlot.id,
            slotId: lectureSlot.slotId,
            lectureId: lecture.id,
            subjectId: subject.id,
            teacherId: lecture.teacherId,
            groupId: subject.groupId,
          }));

        const completeLecture = q
          .from({ item: completeLectureWithoutGroup })
          .innerJoin({ group: groupCollection }, ({ item, group }) =>
            eq(item.groupId, group.id),
          )
          .select(({ item, group }) => ({
            ...item,
            allowSimultaneous: group.allowSimultaneous,
          }));

        return completeLecture;
      },
      // DO NOT USE, this causes liveQuery to not update properly when moving lectureSlots
      // getKey: (item) => item.lectureSlotId,
    }),
  );

  const lectureWithSubdivisionCollection = createCollection(
    liveQueryCollectionOptions({
      id: "lectureWithSubdivision",
      query: (q) =>
        q.from({ completeLectureOnly: completeLectureOnlyCollection }).join(
          // No inner join here because we want lectures that may not have any subdivisions allotted
          { lectureSubdivision: lectureSubdivisionCollection },
          ({ completeLectureOnly, lectureSubdivision }) =>
            eq(completeLectureOnly.lectureId, lectureSubdivision.lectureId),
        ),
    }),
  );

  const lectureWithClassroomCollection = createCollection(
    liveQueryCollectionOptions({
      id: "lectureWithClassroom",
      query: (q) =>
        q.from({ completeLectureOnly: completeLectureOnlyCollection }).join(
          // No inner join here because we want lectures that may not have any classroom allotted
          { lectureClassroom: lectureClassroomCollection },
          ({ completeLectureOnly, lectureClassroom }) =>
            eq(completeLectureOnly.lectureId, lectureClassroom.lectureId),
        ),
    }),
  );
  return {
    completeLectureOnlyCollection,
    lectureWithSubdivisionCollection,
    lectureWithClassroomCollection,
  };
}
