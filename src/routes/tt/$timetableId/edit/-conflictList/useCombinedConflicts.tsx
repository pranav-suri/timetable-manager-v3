import {
  useGroupedClassroomsBySlot,
  useGroupedSubdivisionsBySlot,
  useGroupedTeachersBySlot,
} from "@/routes/timetable/$timetableId/-demoHooks";

export interface Conflict {
  teacherId?: string;
  classroomId?: string;
  subdivisionId?: string;
  lectureSlotIds: string[];
}

export interface CombinedConflicts {
  [slotId: string]: Conflict[];
}

export function useCombinedConflicts() {
  const teacherConflicts = useGroupedTeachersBySlot();
  const classroomConflicts = useGroupedClassroomsBySlot();
  const subdivisionConflicts = useGroupedSubdivisionsBySlot();
  const combined: CombinedConflicts = {};

  // Process teacher conflicts
  for (const slotId in teacherConflicts) {
    combined[slotId] ??= [];
    for (const teacherId in teacherConflicts[slotId]) {
      const lectureSlotIds = teacherConflicts[slotId][teacherId];
      if (!lectureSlotIds) continue;
      combined[slotId].push({
        teacherId,
        lectureSlotIds,
      });
    }
  }

  // Process and merge classroom conflicts
  for (const slotId in classroomConflicts) {
    combined[slotId] ??= [];

    for (const classroomId in classroomConflicts[slotId]) {
      const lectureSlotIds = classroomConflicts[slotId][classroomId];
      if (!lectureSlotIds) continue;
      combined[slotId].push({
        classroomId,
        lectureSlotIds,
      });
    }
  }

  // Process and merge subdivision conflicts
  for (const slotId in subdivisionConflicts) {
    combined[slotId] ??= [];

    for (const subdivisionId in subdivisionConflicts[slotId]) {
      const byGroupAllowSimultaneous =
        subdivisionConflicts[slotId][subdivisionId];
      if (!byGroupAllowSimultaneous) continue;
      const falseLectureSlotIds = byGroupAllowSimultaneous.false;
      const trueLectureSlotIds = Object.values(
        byGroupAllowSimultaneous.true,
      ).flat();
      const lectureSlotIds = [...falseLectureSlotIds, ...trueLectureSlotIds];
      combined[slotId].push({
        subdivisionId,
        lectureSlotIds,
      });
    }
  }

  return combined;
}
