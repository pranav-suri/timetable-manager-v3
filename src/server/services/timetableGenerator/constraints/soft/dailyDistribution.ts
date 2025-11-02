import { SoftConstraintType } from "../../types";
import type { Chromosome, GAInputData, SoftViolation } from "../../types";

/**
 * Check for daily distribution: uneven distribution of lectures across days.
 * Soft constraint - penalizes uneven distribution but doesn't make solution infeasible
 */
export function checkDailyDistribution(
  chromosome: Chromosome,
  inputData: GAInputData,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
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

    const totalDays = 7; // TODO: Get days from input
    const countsArray = Array.from(
      { length: totalDays },
      (_, i) => dayCounts.get(i + 1) || 0,
    );
    const mean = lecture.count / totalDays;
    const variance =
      countsArray.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) /
      totalDays;

    // Only penalize if variance is above a threshold
    if (variance > 1.0) { // TODO: Get variance threshold from config
      const geneIndices = chromosome
        .map((gene, idx) => (gene.lectureId === lectureId ? idx : -1))
        .filter((idx) => idx !== -1);

      violations.push({
        type: SoftConstraintType.DAILY_DISTRIBUTION,
        geneIndices,
        penalty: variance, // Penalty proportional to variance
        description: `Lecture ${lecture.subject.name} has uneven daily distribution (variance: ${variance.toFixed(2)})`,
        entityIds: [lectureId],
      });
    }
  }

  return violations;
}
