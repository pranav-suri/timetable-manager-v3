import { HardConstraintType } from "../../types";
import type { Chromosome, GAInputData, HardViolation } from "../../types";

/**
 * Check for subdivision (student group) clash: students have overlapping lectures.
 * HC2 from research Section 1.2.1
 *
 * Special handling for elective subjects (allowSimultaneous = true):
 * - Subjects in the same group with allowSimultaneous can be scheduled simultaneously
 * - Only violations occur when:
 *   1. Non-elective lectures overlap (allowSimultaneous = false)
 *   2. Elective lectures from different groups overlap in the same slot
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
    // Group by subdivision, then by allowSimultaneous status, then by groupId
    const subdivisionData = new Map<
      string,
      {
        nonElectiveIndices: number[]; // allowSimultaneous = false
        electiveByGroup: Map<string, number[]>; // allowSimultaneous = true, grouped by groupId
      }
    >();

    // Build the structure
    for (const geneIndex of geneIndices) {
      const gene = chromosome[geneIndex];
      if (!gene) continue;

      const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
      if (!lecture) continue;

      const subdivisionIds =
        lookupMaps.eventToSubdivisions.get(gene.lectureEventId) || [];
      const allowSimultaneous = lecture.subject.group.allowSimultaneous;
      const groupId = lecture.subject.groupId;

      for (const subdivisionId of subdivisionIds) {
        if (!subdivisionData.has(subdivisionId)) {
          subdivisionData.set(subdivisionId, {
            nonElectiveIndices: [],
            electiveByGroup: new Map(),
          });
        }

        const data = subdivisionData.get(subdivisionId)!;

        if (allowSimultaneous) {
          // Elective - group by groupId
          if (!data.electiveByGroup.has(groupId)) {
            data.electiveByGroup.set(groupId, []);
          }
          data.electiveByGroup.get(groupId)!.push(geneIndex);
        } else {
          // Non-elective
          data.nonElectiveIndices.push(geneIndex);
        }
      }
    }

    // Check for violations
    for (const [subdivisionId, data] of subdivisionData) {
      const subdivision = subdivisions.find((s) => s.id === subdivisionId);

      // Violation 1: Multiple non-elective lectures overlap
      if (data.nonElectiveIndices.length > 1) {
        violations.push({
          type: HardConstraintType.SUBDIVISION_CLASH,
          geneIndices: data.nonElectiveIndices,
          severity: data.nonElectiveIndices.length,
          description: `Subdivision ${subdivision?.name || subdivisionId} has ${data.nonElectiveIndices.length} overlapping non-elective lectures in slot ${slotId}`,
          entityIds: [subdivisionId, slotId],
        });
      }

      // Violation 2: Non-elective and elective lectures overlap
      // (Any non-elective conflicts with any elective)
      if (data.nonElectiveIndices.length > 0 && data.electiveByGroup.size > 0) {
        const electiveIndices = Array.from(
          data.electiveByGroup.values(),
        ).flat();
        const allIndices = [...data.nonElectiveIndices, ...electiveIndices];
        violations.push({
          type: HardConstraintType.SUBDIVISION_CLASH,
          geneIndices: allIndices,
          severity: allIndices.length,
          description: `Subdivision ${subdivision?.name || subdivisionId} has non-elective and elective lectures overlapping in slot ${slotId}`,
          entityIds: [subdivisionId, slotId],
        });
      }

      // Violation 3: Elective lectures from different groups overlap
      // (Only a violation if there are multiple different groups)
      if (
        data.nonElectiveIndices.length === 0 &&
        data.electiveByGroup.size > 1
      ) {
        const allElectiveIndices = Array.from(
          data.electiveByGroup.values(),
        ).flat();
        violations.push({
          type: HardConstraintType.SUBDIVISION_CLASH,
          geneIndices: allElectiveIndices,
          severity: allElectiveIndices.length,
          description: `Subdivision ${subdivision?.name || subdivisionId} has elective lectures from ${data.electiveByGroup.size} different groups overlapping in slot ${slotId}`,
          entityIds: [subdivisionId, slotId],
        });
      }

      // No violation if: electives from the same group overlap (this is allowed)
    }
  }

  return violations;
}
