/**
 * Constraint Checking Module for Timetable Generator
 *
 * This module implements all hard and soft constraint checking functions
 * as defined in the research document Section 1.2.
 *
 * Performance is critical: these functions are called thousands of times
 * during evolution. All constraint checks use O(1) lookups via Maps/Sets.
 *
 * Architecture:
 * - Individual checker functions for each constraint type
 * - Master evaluation function that aggregates all violations
 * - Hierarchical penalty system (hard >> soft)
 */

import type {
  Chromosome,
  GAInputData,
  HardViolation,
  SoftViolation,
  FitnessResult,
  ConstraintWeights,
  GASlot,
} from "./types";
import { HardConstraintType, SoftConstraintType } from "./types";

// ============================================================================
// HARD CONSTRAINT CHECKERS
// ============================================================================

/**
 * Check for teacher clash: teacher assigned to multiple lectures simultaneously.
 * HC1 from research Section 1.2.1
 */
export function checkTeacherClash(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps } = inputData;

  // Group genes by timeslot for efficient checking
  const slotToGenes = new Map<string, number[]>();
  chromosome.forEach((gene, index) => {
    if (!slotToGenes.has(gene.timeslotId)) {
      slotToGenes.set(gene.timeslotId, []);
    }
    slotToGenes.get(gene.timeslotId)!.push(index);
  });

  // Check each timeslot for teacher conflicts
  for (const [slotId, geneIndices] of slotToGenes) {
    const teacherToGenes = new Map<string, number[]>();

    // Group genes in this slot by teacher
    for (const geneIndex of geneIndices) {
      const gene = chromosome[geneIndex];
      if (!gene) continue;
      const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
      if (!lecture) continue;

      const teacherId = lecture.teacherId;
      if (!teacherToGenes.has(teacherId)) {
        teacherToGenes.set(teacherId, []);
      }
      teacherToGenes.get(teacherId)!.push(geneIndex);
    }

    // Report violations for teachers with multiple assignments
    for (const [teacherId, indices] of teacherToGenes) {
      if (indices.length > 1) {
        const teacher = inputData.teachers.find((t) => t.id === teacherId);
        violations.push({
          type: HardConstraintType.TEACHER_CLASH,
          geneIndices: indices,
          severity: indices.length, // More clashes = higher severity
          description: `Teacher ${teacher?.name || teacherId} assigned to ${indices.length} lectures simultaneously in slot ${slotId}`,
          entityIds: [teacherId, slotId],
        });
      }
    }
  }

  return violations;
}

/**
 * Check for subdivision (student group) clash: students have overlapping lectures.
 * HC2 from research Section 1.2.1
 */
export function checkSubdivisionClash(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps, subdivisions } = inputData;

  // Group genes by timeslot
  const slotToGenes = new Map<string, number[]>();
  chromosome.forEach((gene, index) => {
    if (!slotToGenes.has(gene.timeslotId)) {
      slotToGenes.set(gene.timeslotId, []);
    }
    slotToGenes.get(gene.timeslotId)!.push(index);
  });

  // Check each timeslot for subdivision conflicts
  for (const [slotId, geneIndices] of slotToGenes) {
    const subdivisionToGenes = new Map<string, number[]>();

    // Group genes by subdivision
    for (const geneIndex of geneIndices) {
      const gene = chromosome[geneIndex];
      if (!gene) continue;
      const subdivisionIds =
        lookupMaps.eventToSubdivisions.get(gene.lectureEventId) || [];

      for (const subdivisionId of subdivisionIds) {
        if (!subdivisionToGenes.has(subdivisionId)) {
          subdivisionToGenes.set(subdivisionId, []);
        }
        subdivisionToGenes.get(subdivisionId)!.push(geneIndex);
      }
    }

    // Report violations for subdivisions with multiple assignments
    for (const [subdivisionId, indices] of subdivisionToGenes) {
      if (indices.length > 1) {
        const subdivision = subdivisions.find((s) => s.id === subdivisionId);
        violations.push({
          type: HardConstraintType.SUBDIVISION_CLASH,
          geneIndices: indices,
          severity: indices.length,
          description: `Subdivision ${subdivision?.name || subdivisionId} has ${indices.length} overlapping lectures in slot ${slotId}`,
          entityIds: [subdivisionId, slotId],
        });
      }
    }
  }

  return violations;
}

/**
 * Check for room clash: lectures sharing combined classrooms in same timeslot.
 * HC3 from research Section 1.2.1
 *
 * NOTE: With immutable combined classrooms, a room clash occurs when two lectures
 * that share ANY classroom in their combinedClassrooms list are scheduled in the same slot.
 * Since classrooms can be "opened and combined", we need to check for any overlap.
 */
export function checkRoomClash(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps } = inputData;

  // Group genes by timeslot for efficient checking
  const slotToGenes = new Map<string, number[]>();
  chromosome.forEach((gene, index) => {
    if (!slotToGenes.has(gene.timeslotId)) {
      slotToGenes.set(gene.timeslotId, []);
    }
    slotToGenes.get(gene.timeslotId)!.push(index);
  });

  // Check each timeslot for classroom conflicts
  for (const [slotId, geneIndices] of slotToGenes) {
    // Build a map of classroomId -> gene indices using that classroom
    const classroomToGenes = new Map<string, number[]>();

    for (const geneIndex of geneIndices) {
      const gene = chromosome[geneIndex];
      if (!gene) continue;

      // Get the combined classrooms for this lecture
      const combinedClassrooms =
        lookupMaps.lectureToCombinedClassrooms.get(gene.lectureId) || [];

      // Add this gene index to all its combined classrooms
      for (const classroomId of combinedClassrooms) {
        if (!classroomToGenes.has(classroomId)) {
          classroomToGenes.set(classroomId, []);
        }
        classroomToGenes.get(classroomId)!.push(geneIndex);
      }
    }

    // Report violations for classrooms with multiple lectures
    for (const [classroomId, indices] of classroomToGenes) {
      if (indices.length > 1) {
        const classroom = inputData.classrooms.find(
          (c) => c.id === classroomId,
        );
        // Remove duplicates (same lecture might appear multiple times if it has multiple combined classrooms)
        const uniqueIndices = [...new Set(indices)];

        if (uniqueIndices.length > 1) {
          violations.push({
            type: HardConstraintType.ROOM_CLASH,
            geneIndices: uniqueIndices,
            severity: uniqueIndices.length,
            description: `Classroom ${classroom?.name || classroomId} has ${uniqueIndices.length} lectures scheduled simultaneously in slot ${slotId}`,
            entityIds: [classroomId, slotId],
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Check for teacher unavailability: teacher scheduled during unavailable time.
 * HC4 from research Section 1.2.1
 */
export function checkTeacherUnavailability(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps, teachers } = inputData;

  chromosome.forEach((gene, index) => {
    const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
    if (!lecture) return;

    const teacherId = lecture.teacherId;
    const unavailableSlots = lookupMaps.teacherUnavailable.get(teacherId);

    if (unavailableSlots?.has(gene.timeslotId)) {
      const teacher = teachers.find((t) => t.id === teacherId);
      violations.push({
        type: HardConstraintType.TEACHER_UNAVAILABLE,
        geneIndices: [index],
        severity: 1,
        description: `Teacher ${teacher?.name || teacherId} scheduled during unavailable slot ${gene.timeslotId}`,
        entityIds: [teacherId, gene.timeslotId],
      });
    }
  });

  return violations;
}

/**
 * Check for subdivision unavailability: students scheduled during unavailable time.
 * HC5 from research Section 1.2.1
 */
export function checkSubdivisionUnavailability(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps, subdivisions } = inputData;

  chromosome.forEach((gene, index) => {
    const subdivisionIds =
      lookupMaps.eventToSubdivisions.get(gene.lectureEventId) || [];

    for (const subdivisionId of subdivisionIds) {
      const unavailableSlots =
        lookupMaps.subdivisionUnavailable.get(subdivisionId);

      if (unavailableSlots?.has(gene.timeslotId)) {
        const subdivision = subdivisions.find((s) => s.id === subdivisionId);
        violations.push({
          type: HardConstraintType.SUBDIVISION_UNAVAILABLE,
          geneIndices: [index],
          severity: 1,
          description: `Subdivision ${subdivision?.name || subdivisionId} scheduled during unavailable slot ${gene.timeslotId}`,
          entityIds: [subdivisionId, gene.timeslotId],
        });
      }
    }
  });

  return violations;
}

/**
 * Check for room unavailability: any combined classroom used during unavailable time.
 * HC6 from research Section 1.2.1
 *
 * NOTE: With immutable combined classrooms, we check if ANY of the lecture's
 * combined classrooms are unavailable during the assigned slot.
 */
export function checkRoomUnavailability(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps, classrooms } = inputData;

  chromosome.forEach((gene, index) => {
    // Get the combined classrooms for this lecture
    const combinedClassrooms =
      lookupMaps.lectureToCombinedClassrooms.get(gene.lectureId) || [];

    // Check if any of the combined classrooms are unavailable
    for (const classroomId of combinedClassrooms) {
      const unavailableSlots = lookupMaps.classroomUnavailable.get(classroomId);

      if (unavailableSlots?.has(gene.timeslotId)) {
        const classroom = classrooms.find((c) => c.id === classroomId);
        violations.push({
          type: HardConstraintType.ROOM_UNAVAILABLE,
          geneIndices: [index],
          severity: 1,
          description: `Lecture ${gene.lectureId} uses classroom ${classroom?.name || classroomId} which is unavailable during slot ${gene.timeslotId}`,
          entityIds: [classroomId, gene.timeslotId],
        });
      }
    }
  });

  return violations;
}

/**
 * Check for room capacity constraint: lecture assigned to combined classrooms with insufficient total capacity.
 * HC7 from research Section 1.2.1
 *
 * NOTE: With combined classrooms, we sum the capacities of all classrooms in the combination.
 * Note: Current schema doesn't have classroom capacity, using default placeholder.
 */
export function checkRoomCapacity(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps } = inputData;

  chromosome.forEach((gene, index) => {
    // Get the combined classrooms for this lecture
    const combinedClassrooms =
      lookupMaps.lectureToCombinedClassrooms.get(gene.lectureId) || [];

    // Calculate total capacity of all combined classrooms
    let totalCapacity = 0;
    const classroomNames: string[] = [];

    for (const classroomId of combinedClassrooms) {
      const capacity = lookupMaps.classroomCapacity.get(classroomId) || 100;
      totalCapacity += capacity;
      const classroom = inputData.classrooms.find((c) => c.id === classroomId);
      if (classroom) classroomNames.push(classroom.name);
    }

    // Calculate enrollment from subdivisions
    // Note: We don't have subdivision size in schema, so skip for now
    // This can be enhanced when subdivision capacity is added to schema
    const enrollment = 0; // Placeholder

    if (enrollment > totalCapacity) {
      violations.push({
        type: HardConstraintType.ROOM_CAPACITY,
        geneIndices: [index],
        severity: Math.ceil((enrollment - totalCapacity) / 10), // Proportional to overflow
        description: `Lecture requires ${enrollment} seats but combined classrooms (${classroomNames.join(" + ")}) have total capacity ${totalCapacity}`,
        entityIds: [gene.lectureId, ...combinedClassrooms],
      });
    }
  });

  return violations;
}

/**
 * NOTE: checkAllowedClassroom has been REMOVED.
 *
 * Reason: With immutable combined classrooms, lectures have a fixed set of classrooms
 * defined in GALecture.combinedClassrooms. The classrooms are not assigned during
 * timetable generation - they are predetermined. Therefore, there's no concept of
 * "allowed" vs "not allowed" classrooms during the GA process. The classrooms are
 * simply part of the lecture definition.
 *
 * The constraint that previously checked HC8 (allowed classroom) is now implicitly
 * satisfied by the data structure itself.
 */

/**
 * Check for consecutive slots constraint: multi-slot lectures must be in consecutive periods.
 * HC9 from research Section 1.2.1
 */
export function checkConsecutiveSlots(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps } = inputData;

  // Group genes by lecture ID to check multi-slot lectures
  const lectureToGenes = new Map<string, number[]>();
  chromosome.forEach((gene, index) => {
    const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
    if (!lecture) return;

    if (!lectureToGenes.has(lecture.id)) {
      lectureToGenes.set(lecture.id, []);
    }
    lectureToGenes.get(lecture.id)!.push(index);
  });

  // Check each lecture with duration > 1
  for (const [lectureId, geneIndices] of lectureToGenes) {
    // Get first gene to check lecture properties
    const firstIndex = geneIndices[0];
    if (firstIndex === undefined) continue;
    const firstGene = chromosome[firstIndex];
    if (!firstGene) continue;
    const lecture = lookupMaps.eventToLecture.get(firstGene.lectureEventId);
    if (!lecture || lecture.duration <= 1) continue;

    // For each occurrence of this lecture
    for (const geneIndex of geneIndices) {
      const gene = chromosome[geneIndex];
      if (!gene) continue;
      const slot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
      if (!slot) continue;

      // Check if there are enough consecutive slots available
      const requiredSlots: GASlot[] = [slot];
      let currentSlot = slot;
      let allConsecutive = true;

      for (let i = 1; i < lecture.duration; i++) {
        // Find next consecutive slot (same day, next period)
        const nextSlot = Array.from(lookupMaps.slotIdToSlot.values()).find(
          (s) =>
            s.day === currentSlot.day && s.number === currentSlot.number + 1,
        );

        if (!nextSlot) {
          allConsecutive = false;
          break;
        }

        requiredSlots.push(nextSlot);
        currentSlot = nextSlot;
      }

      if (!allConsecutive) {
        violations.push({
          type: HardConstraintType.CONSECUTIVE_SLOTS,
          geneIndices: [geneIndex],
          severity: lecture.duration, // Longer lectures have higher severity
          description: `Lecture ${lectureId} requires ${lecture.duration} consecutive slots but slot ${gene.timeslotId} doesn't have enough consecutive periods`,
          entityIds: [lectureId, gene.timeslotId],
        });
      }
    }
  }

  return violations;
}

/**
 * Check for locked slot violations: pre-assigned slots should not be changed.
 * HC10 from research (domain-specific constraint)
 */
export function checkLockedSlots(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps } = inputData;

  chromosome.forEach((gene, index) => {
    const lockedAssignment = lookupMaps.lockedAssignments.get(
      gene.lectureEventId,
    );

    if (lockedAssignment && gene.isLocked) {
      // Check if the slot matches the locked assignment
      if (gene.timeslotId !== lockedAssignment.slotId) {
        violations.push({
          type: HardConstraintType.LOCKED_SLOT_VIOLATION,
          geneIndices: [index],
          severity: 10, // High severity - this should never happen
          description: `Locked event ${gene.lectureEventId} assigned to slot ${gene.timeslotId} instead of required slot ${lockedAssignment.slotId}`,
          entityIds: [gene.lectureEventId, gene.timeslotId],
        });
      }
    }
  });

  return violations;
}

// ============================================================================
// SOFT CONSTRAINT CHECKERS
// ============================================================================

/**
 * Check for idle time: gaps between first and last class for subdivisions.
 * SC1 from research Section 1.2.2
 */
export function checkIdleTime(
  chromosome: Chromosome,
  inputData: GAInputData,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
  const { lookupMaps, subdivisions } = inputData;

  // Group genes by subdivision and day
  const subdivisionDayToGenes = new Map<string, number[]>();

  chromosome.forEach((gene, index) => {
    const subdivisionIds =
      lookupMaps.eventToSubdivisions.get(gene.lectureEventId) || [];
    const slot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
    if (!slot) return;

    for (const subdivisionId of subdivisionIds) {
      const key = `${subdivisionId}::${slot.day}`;
      if (!subdivisionDayToGenes.has(key)) {
        subdivisionDayToGenes.set(key, []);
      }
      subdivisionDayToGenes.get(key)!.push(index);
    }
  });

  // Calculate idle time for each subdivision-day pair
  for (const [key, geneIndices] of subdivisionDayToGenes) {
    const parts = key.split("::");
    const subdivisionId = parts[0];
    const dayStr = parts[1];
    if (!subdivisionId || !dayStr) continue;
    const day = parseInt(dayStr);

    // Get all slot periods for this day
    const periods = geneIndices
      .map((idx) => {
        const gene = chromosome[idx];
        if (!gene) return undefined;
        const slot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
        return slot?.number;
      })
      .filter((p): p is number => p !== undefined)
      .sort((a, b) => a - b);

    if (periods.length <= 1) continue;

    const firstPeriod = periods[0];
    const lastPeriod = periods[periods.length - 1];
    if (firstPeriod === undefined || lastPeriod === undefined) continue;

    const totalSpan = lastPeriod - firstPeriod + 1;
    const idleSlots = totalSpan - periods.length;

    if (idleSlots > 0) {
      const subdivision = subdivisions.find((s) => s.id === subdivisionId);
      violations.push({
        type: SoftConstraintType.IDLE_TIME,
        geneIndices,
        penalty: idleSlots, // 1 penalty per idle slot
        description: `Subdivision ${subdivision?.name || subdivisionId} has ${idleSlots} idle slots on day ${day}`,
        entityIds: [subdivisionId, `day-${day}`],
      });
    }
  }

  return violations;
}

/**
 * Check for daily distribution: uneven distribution of lectures across days.
 * HC11 - Converted from soft to hard constraint
 */
export function checkDailyDistribution(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps, lectures } = inputData;

  // Group genes by lecture and day
  const lectureDayToCount = new Map<string, Map<number, number>>();

  chromosome.forEach((gene) => {
    const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
    if (!lecture) return;

    const slot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
    if (!slot) return;

    if (!lectureDayToCount.has(lecture.id)) {
      lectureDayToCount.set(lecture.id, new Map());
    }

    const dayCounts = lectureDayToCount.get(lecture.id)!;
    dayCounts.set(slot.day, (dayCounts.get(slot.day) || 0) + 1);
  });

  // Calculate variance for each lecture
  for (const [lectureId, dayCounts] of lectureDayToCount) {
    const lecture = lectures.find((l) => l.id === lectureId);
    if (!lecture || lecture.count <= 1) continue;

    const counts = Array.from(dayCounts.values());
    const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
    const variance =
      counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;

    if (variance > 1.0) {
      // Threshold for acceptable variance
      const geneIndices = chromosome
        .map((gene, idx) => (gene.lectureId === lectureId ? idx : -1))
        .filter((idx) => idx !== -1);

      violations.push({
        type: HardConstraintType.DAILY_DISTRIBUTION,
        geneIndices,
        severity: Math.floor(variance), // Severity proportional to variance
        description: `Lecture ${lecture.subject.name} has uneven daily distribution (variance: ${variance.toFixed(2)})`,
        entityIds: [lectureId],
      });
    }
  }

  return violations;
}

/**
 * Check for teacher daily limit: teacher exceeds max daily hours.
 * SC3 from research Section 1.2.2
 */
export function checkTeacherDailyLimit(
  chromosome: Chromosome,
  inputData: GAInputData,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
  const { lookupMaps, teachers } = inputData;

  // Group genes by teacher and day
  const teacherDayToHours = new Map<string, Map<number, number>>();

  chromosome.forEach((gene) => {
    const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
    if (!lecture) return;

    const slot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
    if (!slot) return;

    const teacherId = lecture.teacherId;
    if (!teacherDayToHours.has(teacherId)) {
      teacherDayToHours.set(teacherId, new Map());
    }

    const dayHours = teacherDayToHours.get(teacherId)!;
    dayHours.set(slot.day, (dayHours.get(slot.day) || 0) + lecture.duration);
  });

  // Check each teacher's daily hours
  for (const [teacherId, dayHours] of teacherDayToHours) {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) continue;

    for (const [day, hours] of dayHours) {
      if (hours > teacher.dailyMaxHours) {
        const geneIndices = chromosome
          .map((gene, idx) => {
            const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
            const slot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
            return lecture?.teacherId === teacherId && slot?.day === day
              ? idx
              : -1;
          })
          .filter((idx) => idx !== -1);

        violations.push({
          type: SoftConstraintType.TEACHER_DAILY_LIMIT,
          geneIndices,
          penalty: hours - teacher.dailyMaxHours,
          description: `Teacher ${teacher.name} has ${hours} hours on day ${day}, exceeds limit of ${teacher.dailyMaxHours}`,
          entityIds: [teacherId, `day-${day}`],
        });
      }
    }
  }

  return violations;
}

/**
 * Check for teacher weekly limit: teacher exceeds max weekly hours.
 * SC4 from research Section 1.2.2
 */
export function checkTeacherWeeklyLimit(
  chromosome: Chromosome,
  inputData: GAInputData,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
  const { lookupMaps, teachers } = inputData;

  // Count total hours per teacher
  const teacherToHours = new Map<string, number>();

  chromosome.forEach((gene) => {
    const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
    if (!lecture) return;

    const teacherId = lecture.teacherId;
    teacherToHours.set(
      teacherId,
      (teacherToHours.get(teacherId) || 0) + lecture.duration,
    );
  });

  // Check each teacher's weekly hours
  for (const [teacherId, hours] of teacherToHours) {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) continue;

    if (hours > teacher.weeklyMaxHours) {
      const geneIndices = chromosome
        .map((gene, idx) => {
          const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
          return lecture?.teacherId === teacherId ? idx : -1;
        })
        .filter((idx) => idx !== -1);

      violations.push({
        type: SoftConstraintType.TEACHER_WEEKLY_LIMIT,
        geneIndices,
        penalty: (hours - teacher.weeklyMaxHours) * 2, // Higher penalty for weekly violations
        description: `Teacher ${teacher.name} has ${hours} total hours, exceeds limit of ${teacher.weeklyMaxHours}`,
        entityIds: [teacherId],
      });
    }
  }

  return violations;
}

/**
 * Check for consecutive teaching preference: avoid >3 consecutive lectures for teachers.
 * SC5 from research Section 1.2.2
 */
export function checkConsecutivePreference(
  chromosome: Chromosome,
  inputData: GAInputData,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
  const { lookupMaps, teachers } = inputData;

  // Group genes by teacher and day
  const teacherDayToSlots = new Map<string, Map<number, number[]>>();

  chromosome.forEach((gene) => {
    const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
    if (!lecture) return;

    const slot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
    if (!slot) return;

    const teacherId = lecture.teacherId;
    const key = `${teacherId}::${slot.day}`;

    if (!teacherDayToSlots.has(key)) {
      teacherDayToSlots.set(key, new Map());
    }

    const daySlots = teacherDayToSlots.get(key)!;
    if (!daySlots.has(slot.day)) {
      daySlots.set(slot.day, []);
    }
    daySlots.get(slot.day)!.push(slot.number);
  });

  // Check for long consecutive sequences
  for (const [key, daySlots] of teacherDayToSlots) {
    const parts = key.split("::");
    const teacherId = parts[0];
    if (!teacherId) continue;
    const teacher = teachers.find((t) => t.id === teacherId);

    for (const [day, periods] of daySlots) {
      const sortedPeriods = [...periods].sort((a, b) => a - b);

      // Find consecutive sequences
      let consecutiveCount = 1;
      let maxConsecutive = 1;

      for (let i = 1; i < sortedPeriods.length; i++) {
        const currentPeriod = sortedPeriods[i];
        const previousPeriod = sortedPeriods[i - 1];
        if (
          currentPeriod !== undefined &&
          previousPeriod !== undefined &&
          currentPeriod === previousPeriod + 1
        ) {
          consecutiveCount++;
          maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
        } else {
          consecutiveCount = 1;
        }
      }

      if (maxConsecutive > 3) {
        const geneIndices = chromosome
          .map((gene, idx) => {
            const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
            const slot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
            return lecture?.teacherId === teacherId && slot?.day === day
              ? idx
              : -1;
          })
          .filter((idx) => idx !== -1);

        violations.push({
          type: SoftConstraintType.CONSECUTIVE_PREFERENCE,
          geneIndices,
          penalty: maxConsecutive - 3, // Penalty for each period beyond 3
          description: `Teacher ${teacher?.name || teacherId} has ${maxConsecutive} consecutive lectures on day ${day}`,
          entityIds: [teacherId, `day-${day}`],
        });
      }
    }
  }

  return violations;
}

/**
 * Check for excessive daily lectures: penalize when more than lecture.duration
 * lectures of the same subject are scheduled on the same day for a subdivision.
 * This ensures students don't have too many instances of the same subject in one day,
 * regardless of whether they're consecutive or not.
 */
export function checkExcessiveDailyLectures(
  chromosome: Chromosome,
  inputData: GAInputData,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
  const { lookupMaps, subdivisions } = inputData;

  // Group genes by subdivision, day, and lecture
  const subdivisionDayLectureToCount = new Map<string, Map<string, number[]>>();

  chromosome.forEach((gene) => {
    const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
    if (!lecture) return;

    const slot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
    if (!slot) return;

    const subdivisionIds =
      lookupMaps.eventToSubdivisions.get(gene.lectureEventId) || [];

    for (const subdivisionId of subdivisionIds) {
      const key = `${subdivisionId}::${slot.day}`;
      if (!subdivisionDayLectureToCount.has(key)) {
        subdivisionDayLectureToCount.set(key, new Map());
      }

      const lectureMap = subdivisionDayLectureToCount.get(key)!;
      if (!lectureMap.has(lecture.id)) {
        lectureMap.set(lecture.id, []);
      }

      lectureMap.get(lecture.id)!.push(slot.number);
    }
  });

  // Check for excessive daily lectures for each subdivision-day-lecture combination
  for (const [key, lectureMap] of subdivisionDayLectureToCount) {
    const parts = key.split("::");
    const subdivisionId = parts[0];
    const dayStr = parts[1];
    if (!subdivisionId || !dayStr) continue;
    const day = parseInt(dayStr);

    for (const [lectureId, periods] of lectureMap) {
      const lecture = inputData.lectures.find((l) => l.id === lectureId);
      if (!lecture) continue;

      const totalCount = periods.length;

      // If more lectures than duration are scheduled on the same day, create a violation
      if (totalCount > lecture.duration) {
        const violatingGeneIndices = chromosome
          .map((gene, idx) => {
            const geneLecture = lookupMaps.eventToLecture.get(
              gene.lectureEventId,
            );
            const geneSlot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
            const geneSubdivisions =
              lookupMaps.eventToSubdivisions.get(gene.lectureEventId) || [];

            return geneLecture?.id === lectureId &&
              geneSlot?.day === day &&
              geneSubdivisions.includes(subdivisionId)
              ? idx
              : -1;
          })
          .filter((idx) => idx !== -1);

        const subdivision = subdivisions.find((s) => s.id === subdivisionId);
        violations.push({
          type: SoftConstraintType.EXCESSIVE_DAILY_LECTURES,
          geneIndices: violatingGeneIndices,
          penalty: totalCount - lecture.duration, // Penalty for each lecture beyond duration
          description: `Subdivision ${subdivision?.name || subdivisionId} has ${totalCount} lectures of ${lecture.subject.name} on day ${day}, exceeds recommended ${lecture.duration}`,
          entityIds: [subdivisionId, lectureId, `day-${day}`],
        });
      }
    }
  }

  return violations;
}

// ============================================================================
// MASTER CONSTRAINT EVALUATION
// ============================================================================

/**
 * Evaluate all constraints and calculate total fitness for a chromosome.
 * This is the main entry point for constraint checking.
 *
 * Performance target: <100ms for 200-event chromosome
 */
export function evaluateChromosome(
  chromosome: Chromosome,
  inputData: GAInputData,
  weights: ConstraintWeights,
): FitnessResult {
  // Check all hard constraints
  const hardViolations: HardViolation[] = [
    ...checkTeacherClash(chromosome, inputData),
    ...checkSubdivisionClash(chromosome, inputData),
    ...checkRoomClash(chromosome, inputData),
    ...checkTeacherUnavailability(chromosome, inputData),
    ...checkSubdivisionUnavailability(chromosome, inputData),
    ...checkRoomUnavailability(chromosome, inputData),
    ...checkRoomCapacity(chromosome, inputData),
    // checkAllowedClassroom REMOVED - classrooms are now immutable per lecture
    ...checkConsecutiveSlots(chromosome, inputData),
    ...checkLockedSlots(chromosome, inputData),
    ...checkDailyDistribution(chromosome, inputData),
  ];

  // Check all soft constraints
  const softViolations: SoftViolation[] = [
    ...checkIdleTime(chromosome, inputData),
    ...checkTeacherDailyLimit(chromosome, inputData),
    ...checkTeacherWeeklyLimit(chromosome, inputData),
    ...checkConsecutivePreference(chromosome, inputData),
    ...checkExcessiveDailyLectures(chromosome, inputData),
  ];

  // Calculate penalties
  const hardPenalty =
    hardViolations.reduce((sum, v) => sum + v.severity, 0) *
    weights.hardConstraintWeight;

  const softPenalty = softViolations.reduce((sum, v) => {
    switch (v.type) {
      case SoftConstraintType.IDLE_TIME:
        return sum + v.penalty * weights.idleTime;
      case SoftConstraintType.CONSECUTIVE_PREFERENCE:
        return sum + v.penalty * weights.consecutivePreference;
      case SoftConstraintType.TEACHER_DAILY_LIMIT:
        return sum + v.penalty * weights.teacherDailyLimit;
      case SoftConstraintType.TEACHER_WEEKLY_LIMIT:
        return sum + v.penalty * weights.teacherWeeklyLimit;
      case SoftConstraintType.COGNITIVE_LOAD:
        return sum + v.penalty * weights.cognitiveLoad;
      case SoftConstraintType.EXCESSIVE_DAILY_LECTURES:
        return sum + v.penalty * weights.excessiveDailyLectures;
      default:
        return sum + v.penalty;
    }
  }, 0);

  const totalPenalty = hardPenalty + softPenalty;
  const fitnessScore = 1 / (1 + totalPenalty);
  const isFeasible = hardViolations.length === 0;

  return {
    totalPenalty,
    fitnessScore,
    isFeasible,
    hardPenalty,
    softPenalty,
    hardViolations,
    softViolations,
    hardViolationCount: hardViolations.length,
    softViolationCount: softViolations.length,
  };
}

/**
 * Compare two chromosomes according to hierarchical rules.
 * Used for niched-penalty tournament selection.
 *
 * Rules (from research Section 3.2):
 * 1. Feasible > Infeasible
 * 2. If both feasible: lower soft penalty wins
 * 3. If both infeasible: fewer hard violations wins
 * 4. If same hard violations: lower total penalty wins
 */
export function compareChromosomes(
  fitness1: FitnessResult,
  fitness2: FitnessResult,
): number {
  // Rule 1: Feasible beats infeasible
  if (fitness1.isFeasible && !fitness2.isFeasible) return 1;
  if (!fitness1.isFeasible && fitness2.isFeasible) return -1;

  // Rule 2: Both feasible - compare soft penalties
  if (fitness1.isFeasible && fitness2.isFeasible) {
    if (fitness1.softPenalty < fitness2.softPenalty) return 1;
    if (fitness1.softPenalty > fitness2.softPenalty) return -1;
    return 0; // Equal
  }

  // Rule 3 & 4: Both infeasible - compare hard violations, then total penalty
  if (fitness1.hardViolationCount < fitness2.hardViolationCount) return 1;
  if (fitness1.hardViolationCount > fitness2.hardViolationCount) return -1;

  // Same number of hard violations - compare total penalty
  if (fitness1.totalPenalty < fitness2.totalPenalty) return 1;
  if (fitness1.totalPenalty > fitness2.totalPenalty) return -1;

  return 0; // Equal
}
