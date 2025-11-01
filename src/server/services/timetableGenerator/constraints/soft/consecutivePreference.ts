import { SoftConstraintType } from "../../types";
import type { Chromosome, GAInputData, SoftViolation } from "../../types";

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
