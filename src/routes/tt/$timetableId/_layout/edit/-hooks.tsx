import { eq, useLiveQuery } from "@tanstack/react-db";
import { useCollections } from "@/db-collections/providers/useCollections";

export function useBusySlots(lectureSlotId: string | null) {
  const busySlotsByTeacher = useBusySlotsByTeacher(lectureSlotId);
  const busySlotsByClassroom = useBusySlotsByClassroom(lectureSlotId);
  const busySlotsBySubdivision = useBusySlotsBySubdivision(lectureSlotId);

  return new Set([
    ...busySlotsByTeacher,
    ...busySlotsByClassroom,
    ...busySlotsBySubdivision,
  ]);
}

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
  const slotIds = new Set(busyLectureSlots.map((ls) => ls.slotId));
  return slotIds;
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
  const slotIds = new Set(busyLectureSlots.map((ls) => ls.slotId));
  return slotIds;
}

export function useBusySlotsBySubdivision(lectureSlotId: string | null) {
  const { lectureWithSubdivisionCollection, completeLectureOnlyCollection } =
    useCollections();

  const { data: lectureWithSubdivisions } = useLiveQuery((q) =>
    q.from({ lectureWithSubdivisionCollection }),
  );

  const { data: completeLectureSlotMaybe } = useLiveQuery(
    (q) =>
      q
        .from({ comp: completeLectureOnlyCollection })
        .where(({ comp }) => eq(comp.lectureSlotId, lectureSlotId)),
    [lectureSlotId],
  );

  if (!lectureSlotId) return new Set<string>();

  // Get lectureId from lectureSlot
  const completeLectureSlot = completeLectureSlotMaybe.find(
    (comp) => comp.lectureSlotId === lectureSlotId,
  );

  if (!completeLectureSlot) return new Set<string>();
  const currentGroupId = completeLectureSlot.groupId;

  // Find all subdivisions for the initial lecture
  const lectureSubdivisionsForInitialLecture = lectureWithSubdivisions.filter(
    (LwS) =>
      LwS.completeLectureOnly.lectureId === completeLectureSlot.lectureId,
  );

  // Create a Set of subdivisionIds for efficient lookup
  const subdivisionIdsForInitialLecture = new Set(
    lectureSubdivisionsForInitialLecture.map(
      (LwS) => LwS.lectureSubdivision?.subdivisionId ?? "",
    ),
  );
  // Find all other lectureWithSubdivisions that share a subdivision
  const busyLectureWithSubdivisions = lectureWithSubdivisions.filter((LwS) => {
    if (LwS.lectureSubdivision) {
      return subdivisionIdsForInitialLecture.has(
        LwS.lectureSubdivision.subdivisionId,
      );
    }
  });

  const grouped: {
    [slotId: string]: {
      [subdivisionId: string]: {
        // If there are more than one in false array, there is a conflict
        false: string[]; // lectureSlotId
        true: {
          // Subdivision can be in multiple lectureSlots within the same group.
          // Check if there are multiple groups, then there is a conflict
          [groupId: string]: string[]; // lectureSlotId}
        };
      };
    };
  } = {};

  for (const row of busyLectureWithSubdivisions) {
    const slotId = row.completeLectureOnly.slotId;
    const rowLectureSlotId = row.completeLectureOnly.lectureSlotId;
    const subdivisionId = row.lectureSubdivision?.subdivisionId;
    const allowSimultaneous = row.completeLectureOnly.allowSimultaneous;
    const groupId = row.completeLectureOnly.groupId;

    if (!subdivisionId) continue;

    grouped[slotId] ??= {};
    const slotEntry = grouped[slotId];
    slotEntry[subdivisionId] ??= { false: [], true: {} };

    if (allowSimultaneous) {
      slotEntry[subdivisionId].true[groupId] ??= [];
      slotEntry[subdivisionId].true[groupId].push(rowLectureSlotId);
    } else {
      slotEntry[subdivisionId].false.push(rowLectureSlotId);
    }
  }

  for (const slotId in grouped) {
    for (const subdivisionId in grouped[slotId]) {
      const obj = grouped[slotId][subdivisionId];
      if (!obj) continue;

      const isNonElectiveBusy = obj.false.length > 0;

      const groupIds = Object.keys(obj.true);
      let isElectiveBusy = false;
      if (
        // slot is not busy if it doesn't contains lectureSlots if the group is same the current picked up group.
        (groupIds.length == 1 && groupIds.includes(currentGroupId)) ||
        groupIds.length == 0
      ) {
        isElectiveBusy = false;
      } else {
        isElectiveBusy = true;
      }

      if (!isNonElectiveBusy && !isElectiveBusy) {
        delete grouped[slotId][subdivisionId];
      }
    }
    if (Object.keys(grouped[slotId] ?? {}).length === 0) {
      delete grouped[slotId]; // remove empty slots
    }
  }

  // Extract slotIds
  const slotIds = new Set(Object.keys(grouped));

  return slotIds;
}

// NOTE: This is not functional for electives, another hook has already been made
export function useBusySlotsBySubdivisionOld(lectureSlotId: string | null) {
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
  const slotIds = new Set(busyLectureSlots.map((ls) => ls.slotId));
  return slotIds;
}
