import { SoftConstraintType } from "../../types";
import type { Chromosome, GAInputData, SoftViolation } from "../../types";

/**
 * Check for daily distribution: uneven distribution of lecture occurrences across days.
 * Soft constraint - penalizes uneven distribution but doesn't make solution infeasible
 *
 * For multi-duration lectures, we count OCCURRENCES per day, not individual genes.
 * E.g., a lecture with count=2, duration=3 has 2 occurrences (meetings) that should
 * be spread across different days.
 */
export function checkDailyDistribution(
  chromosome: Chromosome,
  inputData: GAInputData,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
  const { lookupMaps, lectures } = inputData;

  // Group genes by lecture and occurrence, then track which day each occurrence is on
  const lectureOccurrenceDays = new Map<string, Map<number, number>>();

  chromosome.forEach((gene) => {
    const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
    if (!lecture) return;

    const slot = lookupMaps.slotIdToSlot.get(gene.timeslotId);
    if (!slot) return;

    // Extract occurrence index from eventId (e.g., "lec1-evt5" with duration=3 -> occurrence 1)
    const eventIdParts = gene.lectureEventId.split("-evt");
    const eventIndex = parseInt(eventIdParts[1] || "0", 10);
    const occurrenceIndex = Math.floor(eventIndex / lecture.duration);

    if (!lectureOccurrenceDays.has(lecture.id)) {
      lectureOccurrenceDays.set(lecture.id, new Map());
    }

    // Map occurrence index to the day it's on
    // (all genes in an occurrence should be on the same day due to consecutive slots constraint)
    lectureOccurrenceDays.get(lecture.id)!.set(occurrenceIndex, slot.day);
  });

  // Count occurrences per day for each lecture
  for (const [lectureId, occurrenceDays] of lectureOccurrenceDays) {
    const lecture = lectures.find((l) => l.id === lectureId);
    if (!lecture || lecture.count <= 1) continue;

    // Count how many occurrences are on each day
    const dayToOccurrenceCount = new Map<number, number>();
    for (const day of occurrenceDays.values()) {
      dayToOccurrenceCount.set(day, (dayToOccurrenceCount.get(day) || 0) + 1);
    }

    const totalDays = 7; // TODO: Get days from input
    const countsArray = Array.from(
      { length: totalDays },
      (_, i) => dayToOccurrenceCount.get(i + 1) || 0,
    );
    const mean = lecture.count / totalDays;
    const variance =
      countsArray.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) /
      totalDays;

    // Only penalize if variance is above a threshold
    if (variance > 1.0) {
      // TODO: Get variance threshold from config
      const geneIndices = chromosome
        .map((gene, idx) => (gene.lectureId === lectureId ? idx : -1))
        .filter((idx) => idx !== -1);

      violations.push({
        type: SoftConstraintType.DAILY_DISTRIBUTION,
        geneIndices,
        penalty: variance, // Penalty proportional to variance
        description: `Lecture ${lecture.subject.name} has uneven daily distribution (variance: ${variance.toFixed(2)}, ${lecture.count} occurrences across ${totalDays} days)`,
        entityIds: [lectureId],
      });
    }
  }

  return violations;
}
