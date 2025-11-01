import { HardConstraintType } from "../../types";
import type { Chromosome, GAInputData, HardViolation } from "../../types";

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
