import { SoftConstraintType } from "../../types";
import type { Chromosome, GAInputData, SoftViolation } from "../../types";

/**
 * Check for subdivision preferred unavailability: students scheduled during preferred unavailable time.
 * This is a SOFT constraint - scheduling is allowed but penalized.
 *
 * Penalty: 5 points per violation
 */
export function checkSubdivisionPreferredUnavailability(
  chromosome: Chromosome,
  inputData: GAInputData,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
  const { lookupMaps, subdivisions } = inputData;

  chromosome.forEach((gene, index) => {
    const subdivisionIds =
      lookupMaps.eventToSubdivisions.get(gene.lectureEventId) || [];

    for (const subdivisionId of subdivisionIds) {
      const subdivision = subdivisions.find((s) => s.id === subdivisionId);
      if (!subdivision) continue;

      // Check if subdivision has any preferred unavailability for this slot
      const isPreferredUnavailable = subdivision.unavailableSlots.some(
        (unavailable) =>
          unavailable.slotId === gene.timeslotId && unavailable.isPreferred,
      );

      if (isPreferredUnavailable) {
        violations.push({
          type: SoftConstraintType.SUBDIVISION_PREFERRED_UNAVAILABLE,
          geneIndices: [index],
          penalty: 5, // Moderate penalty for preferred unavailability
          description: `Subdivision ${subdivision?.name || subdivisionId} scheduled during preferred unavailable slot ${gene.timeslotId}`,
          entityIds: [subdivisionId, gene.timeslotId],
        });
      }
    }
  });

  return violations;
}
