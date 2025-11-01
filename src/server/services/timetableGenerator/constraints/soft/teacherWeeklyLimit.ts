import { SoftConstraintType } from "../../types";
import type { Chromosome, GAInputData, SoftViolation } from "../../types";

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
