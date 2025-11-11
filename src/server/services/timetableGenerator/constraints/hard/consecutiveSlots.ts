import { HardConstraintType } from "../../types";
import type { Chromosome, GAInputData, HardViolation } from "../../types";

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

      // Use pre-calculated slotToNextSlotId map for O(1) consecutive slot lookup
      let currentSlotId: string | undefined = gene.timeslotId;
      let consecutiveCount = 1;

      // Check if we can traverse lecture.duration consecutive slots
      for (let i = 1; i < lecture.duration; i++) {
        currentSlotId = lookupMaps.slotToNextSlotId.get(currentSlotId);
        if (currentSlotId === undefined) {
          // Not enough consecutive slots available
          break;
        }
        consecutiveCount++;
      }

      if (consecutiveCount < lecture.duration) {
        violations.push({
          type: HardConstraintType.CONSECUTIVE_SLOTS,
          geneIndices: [geneIndex],
          severity: lecture.duration,
          description: `Lecture ${lectureId} requires ${lecture.duration} consecutive slots but slot ${gene.timeslotId} only has ${consecutiveCount} consecutive period(s) available`,
          entityIds: [lectureId, gene.timeslotId],
        });
      }
    }
  }

  return violations;
}
