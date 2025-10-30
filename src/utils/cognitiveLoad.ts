// Utility for cognitive load calculation and conflict detection
// Used for scheduling and availability logic

export type CognitiveLoad = {
  teacherId: string;
  load: number;
  details?: string;
};

export type Conflict = {
  type:
    | "TEACHER_UNAVAILABLE"
    | "CLASSROOM_UNAVAILABLE"
    | "SUBDIVISION_UNAVAILABLE"
    | "SLOT_OVERLAP";
  message: string;
  entityId: string;
  slotId?: string;
};

/**
 * Calculate cognitive load per teacher based on:
 * - Number of lectures assigned
 * - Distribution of lectures across days
 * - Number of unavailable slots (constraints)
 */
export function calculateCognitiveLoad(
  lectures: any[],
  unavailableSlots: any[],
): CognitiveLoad[] {
  const teacherLoadMap = new Map<
    string,
    { lectureCount: number; unavailableCount: number }
  >();

  // Count lectures per teacher
  lectures.forEach((lecture) => {
    const teacherId = lecture.teacherId;
    const existing = teacherLoadMap.get(teacherId) || {
      lectureCount: 0,
      unavailableCount: 0,
    };
    teacherLoadMap.set(teacherId, {
      ...existing,
      lectureCount: existing.lectureCount + (lecture.count || 1),
    });
  });

  // Count unavailable slots per teacher
  unavailableSlots.forEach((unavailable) => {
    const teacherId = unavailable.teacherId;
    const existing = teacherLoadMap.get(teacherId) || {
      lectureCount: 0,
      unavailableCount: 0,
    };
    teacherLoadMap.set(teacherId, {
      ...existing,
      unavailableCount: existing.unavailableCount + 1,
    });
  });

  // Calculate normalized load (0-100 scale)
  const loads: CognitiveLoad[] = [];
  teacherLoadMap.forEach((data, teacherId) => {
    const load = Math.min(
      100,
      data.lectureCount * 10 + data.unavailableCount * 2,
    );
    loads.push({
      teacherId,
      load,
      details: `${data.lectureCount} lectures, ${data.unavailableCount} unavailable slots`,
    });
  });

  return loads;
}

/**
 * Detect scheduling conflicts for assigned lectures
 * This complements the constraint-based scheduling in timetableGenerator.ts
 * by validating already-assigned lectures against availability constraints
 */
export function detectConflicts(
  lectures: any[],
  teacherUnavailables: any[],
  classroomUnavailables: any[],
  subdivisionUnavailables: any[],
): Conflict[] {
  const conflicts: Conflict[] = [];

  // Check teacher availability conflicts
  lectures.forEach((lecture) => {
    if (lecture.lectureSlots) {
      lecture.lectureSlots.forEach((lectureSlot: any) => {
        const teacherConflict = teacherUnavailables.find(
          (unavailable) =>
            unavailable.teacherId === lecture.teacherId &&
            unavailable.slotId === lectureSlot.slotId,
        );
        if (teacherConflict) {
          conflicts.push({
            type: "TEACHER_UNAVAILABLE",
            message: `Teacher is unavailable for this slot`,
            entityId: lecture.teacherId,
            slotId: lectureSlot.slotId,
          });
        }
      });
    }
  });

  // Check classroom availability conflicts
  lectures.forEach((lecture) => {
    if (lecture.lectureSlots && lecture.lectureClassrooms) {
      lecture.lectureSlots.forEach((lectureSlot: any) => {
        lecture.lectureClassrooms.forEach((lectureClassroom: any) => {
          const classroomConflict = classroomUnavailables.find(
            (unavailable) =>
              unavailable.classroomId === lectureClassroom.classroomId &&
              unavailable.slotId === lectureSlot.slotId,
          );
          if (classroomConflict) {
            conflicts.push({
              type: "CLASSROOM_UNAVAILABLE",
              message: `Classroom is unavailable for this slot`,
              entityId: lectureClassroom.classroomId,
              slotId: lectureSlot.slotId,
            });
          }
        });
      });
    }
  });

  // Check subdivision availability conflicts
  lectures.forEach((lecture) => {
    if (lecture.lectureSlots && lecture.lectureSubdivisions) {
      lecture.lectureSlots.forEach((lectureSlot: any) => {
        lecture.lectureSubdivisions.forEach((lectureSubdivision: any) => {
          const subdivisionConflict = subdivisionUnavailables.find(
            (unavailable) =>
              unavailable.subdivisionId === lectureSubdivision.subdivisionId &&
              unavailable.slotId === lectureSlot.slotId,
          );
          if (subdivisionConflict) {
            conflicts.push({
              type: "SUBDIVISION_UNAVAILABLE",
              message: `Subdivision is unavailable for this slot`,
              entityId: lectureSubdivision.subdivisionId,
              slotId: lectureSlot.slotId,
            });
          }
        });
      });
    }
  });

  // Check for overlapping slot assignments (same teacher, classroom, or subdivision in same slot)
  const slotAssignments = new Map<string, any[]>();
  lectures.forEach((lecture) => {
    if (lecture.lectureSlots) {
      lecture.lectureSlots.forEach((lectureSlot: any) => {
        const slotId = lectureSlot.slotId;
        if (!slotAssignments.has(slotId)) {
          slotAssignments.set(slotId, []);
        }
        slotAssignments.get(slotId)!.push({
          lecture,
          lectureSlot,
        });
      });
    }
  });

  // Check for conflicts within same slot
  slotAssignments.forEach((assignments, slotId) => {
    for (let i = 0; i < assignments.length; i++) {
      for (let j = i + 1; j < assignments.length; j++) {
        const a = assignments[i].lecture;
        const b = assignments[j].lecture;

        // Teacher conflict
        if (a.teacherId === b.teacherId) {
          conflicts.push({
            type: "SLOT_OVERLAP",
            message: `Teacher has multiple lectures in the same slot`,
            entityId: a.teacherId,
            slotId,
          });
        }

        // Classroom conflict
        if (a.lectureClassrooms && b.lectureClassrooms) {
          const aClassrooms = a.lectureClassrooms.map(
            (lc: any) => lc.classroomId,
          );
          const bClassrooms = b.lectureClassrooms.map(
            (lc: any) => lc.classroomId,
          );
          const commonClassroom = aClassrooms.find((id: string) =>
            bClassrooms.includes(id),
          );
          if (commonClassroom) {
            conflicts.push({
              type: "SLOT_OVERLAP",
              message: `Classroom is double-booked in this slot`,
              entityId: commonClassroom,
              slotId,
            });
          }
        }

        // Subdivision conflict (unless both subjects allow simultaneous)
        if (a.lectureSubdivisions && b.lectureSubdivisions) {
          const aSubdivisions = a.lectureSubdivisions.map(
            (ls: any) => ls.subdivisionId,
          );
          const bSubdivisions = b.lectureSubdivisions.map(
            (ls: any) => ls.subdivisionId,
          );
          const commonSubdivision = aSubdivisions.find((id: string) =>
            bSubdivisions.includes(id),
          );
          if (commonSubdivision) {
            const allowSimultaneousA = a.subject?.group?.allowSimultaneous;
            const allowSimultaneousB = b.subject?.group?.allowSimultaneous;
            if (!allowSimultaneousA || !allowSimultaneousB) {
              conflicts.push({
                type: "SLOT_OVERLAP",
                message: `Subdivision has multiple lectures in the same slot`,
                entityId: commonSubdivision,
                slotId,
              });
            }
          }
        }
      }
    }
  });

  return conflicts;
}
