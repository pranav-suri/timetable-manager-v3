import { SoftConstraintType } from "../../types";
import type { Chromosome, GAInputData, SoftViolation } from "../../types";

/**
 * Check for teacher preferred unavailability: teacher scheduled during preferred unavailable time.
 * This is a SOFT constraint - scheduling is allowed but penalized.
 *
 * Penalty: 5 points per violation
 */
export function checkTeacherPreferredUnavailability(
  chromosome: Chromosome,
  inputData: GAInputData,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
  const { lookupMaps, teachers } = inputData;

  chromosome.forEach((gene, index) => {
    const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
    if (!lecture) return;

    const teacherId = lecture.teacherId;
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    // Check if teacher has any preferred unavailability marked for this slot
    const isPreferredUnavailable = teacher.unavailableSlots.some(
      (unavailable) =>
        unavailable.slotId === gene.timeslotId && unavailable.isPreferred,
    );

    if (isPreferredUnavailable) {
      violations.push({
        type: SoftConstraintType.TEACHER_PREFERRED_UNAVAILABLE,
        geneIndices: [index],
        penalty: 5, // Moderate penalty for preferred unavailability
        description: `Teacher ${teacher?.name || teacherId} scheduled during preferred unavailable slot ${gene.timeslotId}`,
        entityIds: [teacherId, gene.timeslotId],
      });
    }
  });

  return violations;
}
