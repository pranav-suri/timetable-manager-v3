import type {
  Chromosome,
  ConstraintWeights,
  GAInputData,
  SoftViolation,
} from "../../types";
import { SoftConstraintType } from "../../types";

export function checkMultiDurationLate(
  chromosome: Chromosome,
  input: GAInputData,
  weights: ConstraintWeights,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
  if (!weights.multiDurationLate || weights.multiDurationLate === 0) {
    return violations;
  }

  // Consider the last 2 slots of the day as "late"
  const periodsPerDay = Math.max(...input.slots.map((slot) => slot.number)) + 1;
  const lateThreshold = periodsPerDay - 2;

  chromosome.forEach((gene, idx) => {
    const lecture = input.lookupMaps.eventToLecture.get(gene.lectureEventId);
    if (!lecture || lecture.duration <= 1) {
      return; // Only check for multi-duration lectures
    }

    const slot = input.lookupMaps.slotIdToSlot.get(gene.timeslotId);
    if (!slot) {
      return;
    }

    // Check if the lecture starts in a late slot
    if (slot.number > lateThreshold) {
      violations.push({
        type: SoftConstraintType.MULTI_DURATION_LATE,
        geneIndices: [idx],
        penalty: 1, // The weight will be applied in evaluate.ts
        description: `Multi-duration lecture '${lecture.subject.name}' starts late in the day (slot ${slot.number}).`,
        entityIds: [lecture.id, `slot-${slot.number}`],
      });
    }
  });

  return violations;
}
