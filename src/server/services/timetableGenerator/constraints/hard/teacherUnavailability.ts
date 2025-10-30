import type { Chromosome, GAInputData, HardViolation } from "../../types";
import { HardConstraintType } from "../../types";

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
