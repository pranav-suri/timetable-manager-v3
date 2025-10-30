import type { Chromosome, GAInputData, HardViolation } from "../../types";
import { HardConstraintType } from "../../types";

/**
 * Check for locked slot violations: pre-assigned slots should not be changed.
 * HC10 from research (domain-specific constraint)
 */
export function checkLockedSlots(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps } = inputData;

  chromosome.forEach((gene, index) => {
    const lockedAssignment = lookupMaps.lockedAssignments.get(
      gene.lectureEventId,
    );

    if (lockedAssignment && gene.isLocked) {
      // Check if the slot matches the locked assignment
      if (gene.timeslotId !== lockedAssignment.slotId) {
        violations.push({
          type: HardConstraintType.LOCKED_SLOT_VIOLATION,
          geneIndices: [index],
          severity: 10, // High severity - this should never happen
          description: `Locked event ${gene.lectureEventId} assigned to slot ${gene.timeslotId} instead of required slot ${lockedAssignment.slotId}`,
          entityIds: [gene.lectureEventId, gene.timeslotId],
        });
      }
    }
  });

  return violations;
}
