import { eq, useLiveQuery } from "@tanstack/react-db";
import { useCollections } from "@/db-collections/providers/useCollections";

export function useBusySlotsByTeacher(lectureSlotId: string | null) {
  const { lectureSlotCollection, lectureCollection } = useCollections();
  // Get all lectureSlots
  const { data: allLectureSlots, collection: allLectureSlotCollection } =
    useLiveQuery((q) => q.from({ lectureSlot: lectureSlotCollection }));

  // Get all lectures
  const { data: allLectures, collection: allLectureCollection } = useLiveQuery(
    (q) => q.from({ lecture: lectureCollection }),
  );

  if (!lectureSlotId) {
    return new Set<string>();
  }

  // Get lectureId from lectureSlot
  const lectureSlot = allLectureSlotCollection.get(lectureSlotId);
  if (!lectureSlot) return new Set<string>();

  // Get teacherId from lecture
  const lecture = allLectureCollection.get(lectureSlot.lectureId);
  if (!lecture) return new Set<string>();

  // Get all lectures for the teacher
  const teacherLectures = allLectures.filter(
    (l) => l.teacherId === lecture.teacherId,
  );

  // Get all lectureSlots for these lectures
  const busyLectureSlots = allLectureSlots.filter((ls) =>
    teacherLectures.some((tl) => tl.id === ls.lectureId),
  );

  // Extract slotIds
  return new Set(busyLectureSlots.map((ls) => ls.slotId));
}
export function useBusySlotsByTeacherNew(lectureSlotId: string | null) {
  const {
    lectureSlotCollection,
    lectureCollection,
    completeLectureOnlyCollection,
  } = useCollections();

  let teacherId = "";

  // Get all lectureSlots
  const { collection: allLectureSlotCollection } = useLiveQuery((q) =>
    q.from({ lectureSlot: lectureSlotCollection }),
  );

  // Get all lectures
  const { collection: allLectureCollection } = useLiveQuery((q) =>
    q.from({ lecture: lectureCollection }),
  );

  // Get lectureId from lectureSlot
  const lectureSlot = allLectureSlotCollection.get(lectureSlotId ?? "");

  // Get teacherId from lecture
  const lecture = allLectureCollection.get(lectureSlot?.lectureId ?? "");

  teacherId = lecture?.teacherId ?? "";

  // Get busy lectureSlots
  const { data: busyLectureSlots } = useLiveQuery(
    (q) =>
      q
        .from({ comp: completeLectureOnlyCollection })
        .where(({ comp }) => eq(comp.teacherId, teacherId)),
    [teacherId],
  );

  // Extract slotIds
  const slotIds = new Set(busyLectureSlots.map((ls) => ls.slotId));
  return slotIds;
}
export function useBusySlotsByClassroom(lectureSlotId: string | null) {
  const {
    lectureSlotCollection,
    lectureCollection,
    lectureClassroomCollection,
  } = useCollections();
  // Get all lectureSlots
  const { data: allLectureSlots, collection: allLectureSlotCollection } =
    useLiveQuery((q) => q.from({ lectureSlot: lectureSlotCollection }));

  // Get all lectures
  const { collection: allLectureCollection } = useLiveQuery((q) =>
    q.from({ lecture: lectureCollection }),
  );

  // Get all lectureClassrooms
  const { data: allLectureClassrooms } = useLiveQuery((q) =>
    q.from({ lectureClassroom: lectureClassroomCollection }),
  );

  if (!lectureSlotId) return new Set<string>();

  // Get lectureId from lectureSlot
  const lectureSlot = allLectureSlotCollection.get(lectureSlotId);
  if (!lectureSlot) return new Set<string>();

  // Get lecture
  const lecture = allLectureCollection.get(lectureSlot.lectureId);
  if (!lecture) return new Set<string>();

  // Find all classrooms for the initial lecture
  const lectureClassroomsForInitialLecture = allLectureClassrooms.filter(
    (lc) => lc.lectureId === lecture.id,
  );

  // Create a Set of classroomIds for efficient lookup
  const classroomIdsForInitialLecture = new Set(
    lectureClassroomsForInitialLecture.map((lc) => lc.classroomId),
  );

  // Find all other lectureClassrooms that share a classroom
  const busyLectureClassrooms = allLectureClassrooms.filter((lc) =>
    classroomIdsForInitialLecture.has(lc.classroomId),
  );

  // Extract all unique lecture IDs from the busy lectureClassrooms
  const busyLectureIds = new Set(busyLectureClassrooms.map((l) => l.lectureId));

  // Find all lectureSlots associated with these busy lecture IDs
  const busyLectureSlots = allLectureSlots.filter((ls) =>
    busyLectureIds.has(ls.lectureId),
  );

  // Extract slotIds
  return new Set(busyLectureSlots.map((ls) => ls.slotId));
}
export function useBusySlotsBySubdivision(lectureSlotId: string | null) {
  const {
    lectureSlotCollection,
    lectureCollection,
    lectureSubdivisionCollection,
  } = useCollections();
  // Get all lectureSlots
  const { data: allLectureSlots, collection: allLectureSlotCollection } =
    useLiveQuery((q) => q.from({ lectureSlot: lectureSlotCollection }));

  // Get all lectures
  const { collection: allLectureCollection } = useLiveQuery((q) =>
    q.from({ lecture: lectureCollection }),
  );

  // Get all lectureSubdivisions
  const { data: allLectureSubdivisions } = useLiveQuery((q) =>
    q.from({ lectureSubdivision: lectureSubdivisionCollection }),
  );

  if (!lectureSlotId) return new Set<string>();

  // Get lectureId from lectureSlot
  const lectureSlot = allLectureSlotCollection.get(lectureSlotId);
  if (!lectureSlot) return new Set<string>();

  // Get lecture
  const lecture = allLectureCollection.get(lectureSlot.lectureId);
  if (!lecture) return new Set<string>();

  // Find all subdivisions for the initial lecture
  const lectureSubdivisionsForInitialLecture = allLectureSubdivisions.filter(
    (lc) => lc.lectureId === lecture.id,
  );

  // Create a Set of subdivisionIds for efficient lookup
  const subdivisionIdsForInitialLecture = new Set(
    lectureSubdivisionsForInitialLecture.map((lc) => lc.subdivisionId),
  );

  // Find all other lectureSubdivisions that share a subdivision
  const busyLectureSubdivisions = allLectureSubdivisions.filter((lc) =>
    subdivisionIdsForInitialLecture.has(lc.subdivisionId),
  );

  // Extract all unique lecture IDs from the busy lectureSubdivisions
  const busyLectureIds = new Set(
    busyLectureSubdivisions.map((l) => l.lectureId),
  );

  // Find all lectureSlots associated with these busy lecture IDs
  const busyLectureSlots = allLectureSlots.filter((ls) =>
    busyLectureIds.has(ls.lectureId),
  );

  // Extract slotIds
  return new Set(busyLectureSlots.map((ls) => ls.slotId));
}
