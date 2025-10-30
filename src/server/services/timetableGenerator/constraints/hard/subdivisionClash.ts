import type { Chromosome, GAInputData, HardViolation } from "../../types";
import { HardConstraintType } from "../../types";

/**
 * Check for subdivision (student group) clash: students have overlapping lectures.
 * HC2 from research Section 1.2.1
 */
export function checkSubdivisionClash(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps, subdivisions } = inputData;

  // Group genes by timeslot
  const slotToGenes = new Map<string, number[]>();
  chromosome.forEach((gene, index) => {
    if (!slotToGenes.has(gene.timeslotId)) {
      slotToGenes.set(gene.timeslotId, []);
    }
    slotToGenes.get(gene.timeslotId)!.push(index);
  });

  // Check each timeslot for subdivision conflicts
  for (const [slotId, geneIndices] of slotToGenes) {
    const subdivisionToGenes = new Map<string, number[]>();

    // Group genes by subdivision
    for (const geneIndex of geneIndices) {
      const gene = chromosome[geneIndex];
      if (!gene) continue;
      const subdivisionIds =
        lookupMaps.eventToSubdivisions.get(gene.lectureEventId) || [];

      for (const subdivisionId of subdivisionIds) {
        if (!subdivisionToGenes.has(subdivisionId)) {
          subdivisionToGenes.set(subdivisionId, []);
        }
        subdivisionToGenes.get(subdivisionId)!.push(geneIndex);
      }
    }

    // Report violations for subdivisions with multiple assignments
    for (const [subdivisionId, indices] of subdivisionToGenes) {
      if (indices.length > 1) {
        const subdivision = subdivisions.find((s) => s.id === subdivisionId);
        violations.push({
          type: HardConstraintType.SUBDIVISION_CLASH,
          geneIndices: indices,
          severity: indices.length,
          description: `Subdivision ${subdivision?.name || subdivisionId} has ${indices.length} overlapping lectures in slot ${slotId}`,
          entityIds: [subdivisionId, slotId],
        });
      }
    }
  }

  return violations;
}
