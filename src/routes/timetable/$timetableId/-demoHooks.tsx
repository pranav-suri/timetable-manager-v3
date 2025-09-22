import {
  concat,
  count,
  createLiveQueryCollection,
  eq,
  gt,
  useLiveQuery,
} from "@tanstack/react-db";
import { useCollections } from "@/db-collections/providers/useCollections";

export function useSubset() {
  const { timetableCollection } = useCollections();

  const stableCollection = createLiveQueryCollection((q) =>
    q
      .from({ tt: timetableCollection })
      .orderBy(({ tt }) => tt.createdAt, "asc")
      .limit(10),
  );

  return stableCollection;
}

export function useGroupedTeachersBySlot() {
  const { completeLectureOnlyCollection } = useCollections();

  const { data } = useLiveQuery((q) =>
    q.from({ completeLectureOnlyCollection }),
  );

  const grouped: {
    [slotId: string]: {
      [teacherId: string]: string[]; // lectureSlotId
    };
  } = {};

  for (const row of data) {
    const slotId = row.slotId;
    const teacherId = row.teacherId;
    const lectureSlotId = row.lectureSlotId;

    grouped[slotId] ??= {};
    grouped[slotId][teacherId] ??= [];
    grouped[slotId][teacherId].push(lectureSlotId);
  }

  // keep only teachers with conflicts (length > 1)
  for (const slotId in grouped) {
    for (const teacherId in grouped[slotId]) {
      if ((grouped[slotId][teacherId]?.length ?? 0) <= 1) {
        delete grouped[slotId][teacherId];
      }
    }
    if (Object.keys(grouped[slotId] ?? {}).length === 0) {
      delete grouped[slotId]; // remove empty slots
    }
  }

  return grouped;
}

export function useGroupedClassroomsBySlot() {
  const { lectureWithClassroomCollection } = useCollections();

  const { data } = useLiveQuery((q) =>
    q.from({ lectureWithClassroomCollection }),
  );

  const grouped: {
    [slotId: string]: {
      [classroomId: string]: string[]; // lectureSlotId
    };
  } = {};

  for (const row of data) {
    const slotId = row.completeLectureOnly.slotId;
    const lectureSlotId = row.completeLectureOnly.lectureSlotId;
    const classroomId = row.lectureClassroom?.classroomId;
    if (!classroomId) continue;

    grouped[slotId] ??= {};
    grouped[slotId][classroomId] ??= [];
    grouped[slotId][classroomId].push(lectureSlotId);
  }

  // keep only classrooms with conflicts (length > 1)
  for (const slotId in grouped) {
    for (const classroomId in grouped[slotId]) {
      if ((grouped[slotId][classroomId]?.length ?? 0) <= 1) {
        delete grouped[slotId][classroomId];
      }
    }
    if (Object.keys(grouped[slotId] ?? {}).length === 0) {
      delete grouped[slotId]; // remove empty slots
    }
  }
  return grouped;
}

export function useGroupedSubdivisionsWithoutElectiveBySlot() {
  const { lectureWithSubdivisionCollection } = useCollections();

  const { data } = useLiveQuery((q) =>
    q.from({ lectureWithSubdivisionCollection }),
  );

  const grouped: {
    [slotId: string]: {
      [subdivisionId: string]: string[]; // lectureSlotId
    };
  } = {};

  for (const row of data) {
    const slotId = row.completeLectureOnly.slotId;
    const lectureSlotId = row.completeLectureOnly.lectureSlotId;
    const subdivisionId = row.lectureSubdivision?.subdivisionId;
    if (!subdivisionId) continue;

    grouped[slotId] ??= {};
    grouped[slotId][subdivisionId] ??= [];
    grouped[slotId][subdivisionId].push(lectureSlotId);
  }

  // keep only subdivisions with conflicts (length > 1)
  for (const slotId in grouped) {
    for (const subdivisionId in grouped[slotId]) {
      if ((grouped[slotId][subdivisionId]?.length ?? 0) <= 1) {
        delete grouped[slotId][subdivisionId];
      }
    }
    if (Object.keys(grouped[slotId] ?? {}).length === 0) {
      delete grouped[slotId]; // remove empty slots
    }
  }

  return grouped;
}

export function useGroupedSubdivisionsBySlot() {
  const { lectureWithSubdivisionCollection } = useCollections();

  const { data = [] } = useLiveQuery((q) =>
    q.from({ lectureWithSubdivisionCollection }),
  );

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

  for (const row of data) {
    const slotId = row.completeLectureOnly.slotId;
    const lectureSlotId = row.completeLectureOnly.lectureSlotId;
    const subdivisionId = row.lectureSubdivision?.subdivisionId;
    const allowSimultaneous = row.completeLectureOnly.allowSimultaneous;
    const groupId = row.completeLectureOnly.groupId;

    if (!subdivisionId) continue;

    grouped[slotId] ??= {};
    const slotEntry = grouped[slotId];
    slotEntry[subdivisionId] ??= { false: [], true: {} };

    if (allowSimultaneous) {
      slotEntry[subdivisionId].true[groupId] ??= [];
      slotEntry[subdivisionId].true[groupId].push(lectureSlotId);
    } else {
      slotEntry[subdivisionId].false.push(lectureSlotId);
    }
  }

  for (const slotId in grouped) {
    for (const subdivisionId in grouped[slotId]) {
      const entry = grouped[slotId][subdivisionId];
      if (!entry) continue;

      // for non electives: two cannot be in the same slot
      const hasNonElectiveConflict = entry.false.length > 1;

      // for electives: if there is more than one elective group
      const electiveGroups = Object.values(entry.true);
      const hasElectiveConflict = electiveGroups.length > 1;

      if (!hasNonElectiveConflict && !hasElectiveConflict) {
        delete grouped[slotId][subdivisionId];
      }
    }
    if (Object.keys(grouped[slotId] ?? {}).length === 0) {
      delete grouped[slotId];
    }
  }

  return grouped;
}

export function useDbBasedGroupedTeachersBySlot() {
  const { completeLectureOnlyCollection } = useCollections();

  const { data } = useLiveQuery((q) => {
    const conflicted = q
      .from({ comp: completeLectureOnlyCollection })
      .groupBy(({ comp }) => [
        comp.slotId,
        comp.teacherId,
        concat(comp.slotId, ":", comp.teacherId),
      ])
      .select(({ comp }) => ({
        slotId: comp.slotId,
        teacherId: comp.teacherId,
        key: concat(comp.slotId, ":", comp.teacherId), // composite join key
        lectureSlotCount: count(comp.lectureSlotId),
      }))
      .having(({ comp }) => gt(count(comp.lectureSlotId), 1));

    return q
      .from({ comp: completeLectureOnlyCollection })
      .innerJoin({ conflicted }, ({ comp, conflicted: conf }) =>
        eq(conf.key, concat(comp.slotId, ":", comp.teacherId)),
      )
      .select(({ comp }) => ({ ...comp })); // NOTE: This needs to be spread, otherwise returns empty object
  });

  const grouped: {
    [slotId: string]: {
      [teacherId: string]: string[]; // lectureSlotId
    };
  } = {};

  for (const row of data) {
    const slotId = row.slotId;
    const teacherId = row.teacherId;
    const lectureSlotId = row.lectureSlotId;

    grouped[slotId] ??= {};
    grouped[slotId][teacherId] ??= [];
    grouped[slotId][teacherId].push(lectureSlotId);
  }

  return grouped;
}
