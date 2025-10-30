import { eq, inArray, useLiveQuery } from "@tanstack/react-db";
import { useCollections } from "@/db-collections/providers/useCollections";
import { useLectureSlotFiltersStore } from "@/zustand/lectureSlotFiltersStore";

/**
 * Hook to get filtered lecture slots based on the active filters from the store
 * Supports filtering by teacherIds, subdivisionIds, classroomIds, and subjectIds
 *
 * @param slotId - The slot ID to fetch lectures for
 * @returns Filtered and ordered lecture slots
 */
export function useFilteredLecturesInSlot(slotId: string) {
  const {
    subjectCollection,
    completeLectureOnlyCollection,
    lectureWithSubdivisionCollection,
    lectureWithClassroomCollection,
  } = useCollections();

  const { teacherIds, subdivisionIds, classroomIds, subjectIds } =
    useLectureSlotFiltersStore();

  // Query base lectures with teacher and subject filters
  const { data: baseLectures } = useLiveQuery(
    (q) => {
      let query = q
        .from({ item: completeLectureOnlyCollection })
        .innerJoin({ subject: subjectCollection }, ({ item, subject }) =>
          eq(item.subjectId, subject.id),
        )
        .where(({ item }) => eq(item.slotId, slotId))
        .orderBy(({ subject }) => subject.name)
        .select(({ item }) => ({ ...item }));

      // Apply teacher filter if active
      if (teacherIds.length > 0) {
        query = query.where(({ item }) => inArray(item.teacherId, teacherIds));
      }

      // Apply subject filter if active
      if (subjectIds.length > 0) {
        query = query.where(({ item }) => inArray(item.subjectId, subjectIds));
      }

      return query;
    },
    [
      slotId,
      completeLectureOnlyCollection,
      subjectCollection,
      teacherIds,
      subjectIds,
    ],
  );

  console.log(baseLectures);

  // // Get subdivision data for active filters
  const { data: lecturesWithSubdivisions } = useLiveQuery(
    (q) =>
      q
        .from({ item: lectureWithSubdivisionCollection })
        .where(({ item }) => eq(item.completeLectureOnly.slotId, slotId))
        .select(({ item }) => ({
          lectureId: item.completeLectureOnly.lectureId,
          subdivisionId: item.lectureSubdivision?.subdivisionId,
        })),
    [slotId, lectureWithSubdivisionCollection],
  );

  // // Get classroom data for active filters
  const { data: lecturesWithClassrooms } = useLiveQuery(
    (q) =>
      q
        .from({ item: lectureWithClassroomCollection })
        .where(({ item }) => eq(item.completeLectureOnly.slotId, slotId))
        .select(({ item }) => ({
          lectureId: item.completeLectureOnly.lectureId,
          classroomId: item.lectureClassroom?.classroomId,
        })),
    [slotId, lectureWithClassroomCollection],
  );
  console.log(lecturesWithClassrooms);

  // // Apply subdivision and classroom filters on the client side
  const filteredLectures = baseLectures.filter((lecture) => {
    // Check subdivision filter if active
    if (subdivisionIds.length > 0) {
      const lectureSubdivisions = lecturesWithSubdivisions
        .filter((ls) => ls.lectureId === lecture.lectureId)
        .map((ls) => ls.subdivisionId);

      if (
        lectureSubdivisions.length === 0 ||
        !lectureSubdivisions.some((id) => subdivisionIds.includes(id || ""))
      ) {
        return false;
      }
    }

    // Check classroom filter if active
    if (classroomIds.length > 0) {
      const lectureClassrooms = lecturesWithClassrooms
        .filter((lc) => lc.lectureId === lecture.lectureId)
        .map((lc) => lc.classroomId);

      if (
        lectureClassrooms.length === 0 ||
        !lectureClassrooms.some((id) => classroomIds.includes(id || ""))
      ) {
        return false;
      }
    }

    return true;
  });
  console.log("Filtered Lectures:", filteredLectures);

  return filteredLectures;
}
