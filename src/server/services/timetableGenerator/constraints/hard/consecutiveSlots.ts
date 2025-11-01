import { HardConstraintType } from "../../types";
import type {
  Chromosome,
  GAInputData,
  GASlot,
  HardViolation,
} from "../../types";

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
          severity: lecture.duration,
          description: `Lecture ${lectureId} requires ${lecture.duration} consecutive slots but slot ${gene.timeslotId} doesn't have enough consecutive periods`,
          entityIds: [lectureId, gene.timeslotId],
        });
      }
    }
  }

  return violations;
}
