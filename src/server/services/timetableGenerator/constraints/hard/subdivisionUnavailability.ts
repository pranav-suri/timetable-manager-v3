import { HardConstraintType } from "../../types";
import type { Chromosome, GAInputData, HardViolation } from "../../types";

/**
 * Check for subdivision unavailability: students scheduled during unavailable time.
 * HC5 from research Section 1.2.1
 */
export function checkSubdivisionUnavailability(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps, subdivisions } = inputData;

  chromosome.forEach((gene, index) => {
    const subdivisionIds =
      lookupMaps.eventToSubdivisions.get(gene.lectureEventId) || [];

    for (const subdivisionId of subdivisionIds) {
      const unavailableSlots =
        lookupMaps.subdivisionUnavailable.get(subdivisionId);

      if (unavailableSlots?.has(gene.timeslotId)) {
        const subdivision = subdivisions.find((s) => s.id === subdivisionId);
        violations.push({
          type: HardConstraintType.SUBDIVISION_UNAVAILABLE,
          geneIndices: [index],
          severity: 1,
          description: `Subdivision ${subdivision?.name || subdivisionId} scheduled during unavailable slot ${gene.timeslotId}`,
          entityIds: [subdivisionId, gene.timeslotId],
        });
      }
    }
  });

  return violations;
}
