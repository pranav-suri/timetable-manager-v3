import { SoftConstraintType } from "../../types";
import type { Chromosome, GAInputData, SoftViolation } from "../../types";

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
