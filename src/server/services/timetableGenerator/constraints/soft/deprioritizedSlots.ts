import type {
  Chromosome,
  ConstraintWeights,
  GAInputData,
  SoftViolation,
} from "../../types";
import { SoftConstraintType } from "../../types";

export function checkDeprioritizedSlots(
  chromosome: Chromosome,
  input: GAInputData,
  weights: ConstraintWeights,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
  const deprioritizedDays = new Set(weights.deprioritizedDays || []);
  const deprioritizedSlots = new Set(weights.deprioritizedSlotNumbers || []);
  const deprioritizedDaySlots = new Set(
    (weights.deprioritizedDaySlots || []).map((p) => `${p.day}:${p.period}`),
  );

  if (
    deprioritizedDays.size === 0 &&
    deprioritizedSlots.size === 0 &&
    deprioritizedDaySlots.size === 0
  ) {
    return violations;
  }

  chromosome.forEach((gene, idx) => {
    const lecture = input.lookupMaps.eventToLecture.get(gene.lectureEventId);
    const slot = input.lookupMaps.slotIdToSlot.get(gene.timeslotId);
    if (!lecture || !slot) return;

    if (deprioritizedDays.has(slot.day)) {
      violations.push({
        type: SoftConstraintType.DEPRIORITIZED_DAY,
        geneIndices: [idx],
        penalty: 1,
        description: `Scheduled on deprioritized day ${slot.day}`,
        entityIds: [lecture.id, `day-${slot.day}`],
      });
    }

    if (deprioritizedSlots.has(slot.number)) {
      violations.push({
        type: SoftConstraintType.DEPRIORITIZED_SLOT,
        geneIndices: [idx],
        penalty: 1,
        description: `Scheduled in deprioritized slot ${slot.number}`,
        entityIds: [lecture.id, `slot-${slot.number}`],
      });
    }

    if (deprioritizedDaySlots.has(`${slot.day}:${slot.number}`)) {
      violations.push({
        type: SoftConstraintType.DEPRIORITIZED_DAY_SLOT,
        geneIndices: [idx],
        penalty: 1,
        description: `Scheduled in deprioritized day-slot ${slot.day},${slot.number}`,
        entityIds: [lecture.id, `day-${slot.day}`, `slot-${slot.number}`],
      });
    }
  });

  return violations;
}
