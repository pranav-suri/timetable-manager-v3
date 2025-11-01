import { HardConstraintType } from "../../types";
import type { Chromosome, GAInputData, HardViolation } from "../../types";

/**
 * Check for room clash: lectures sharing combined classrooms in same timeslot.
 * HC3 from research Section 1.2.1
 *
 * NOTE: With immutable combined classrooms, a room clash occurs when two lectures
 * that share ANY classroom in their combinedClassrooms list are scheduled in the same slot.
 */
export function checkRoomClash(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps } = inputData;

  // Group genes by timeslot for efficient checking
  const slotToGenes = new Map<string, number[]>();
  chromosome.forEach((gene, index) => {
    if (!slotToGenes.has(gene.timeslotId)) {
      slotToGenes.set(gene.timeslotId, []);
    }
    slotToGenes.get(gene.timeslotId)!.push(index);
  });

  // Check each timeslot for classroom conflicts
  for (const [slotId, geneIndices] of slotToGenes) {
    // Build a map of classroomId -> gene indices using that classroom
    const classroomToGenes = new Map<string, number[]>();

    for (const geneIndex of geneIndices) {
      const gene = chromosome[geneIndex];
      if (!gene) continue;

      // Get the combined classrooms for this lecture
      const combinedClassrooms =
        lookupMaps.lectureToCombinedClassrooms.get(gene.lectureId) || [];

      // Add this gene index to all its combined classrooms
      for (const classroomId of combinedClassrooms) {
        if (!classroomToGenes.has(classroomId)) {
          classroomToGenes.set(classroomId, []);
        }
        classroomToGenes.get(classroomId)!.push(geneIndex);
      }
    }

    // Report violations for classrooms with multiple lectures
    for (const [classroomId, indices] of classroomToGenes) {
      if (indices.length > 1) {
        const classroom = inputData.classrooms.find(
          (c) => c.id === classroomId,
        );
        // Remove duplicates (same lecture might appear multiple times if it has multiple combined classrooms)
        const uniqueIndices = [...new Set(indices)];

        if (uniqueIndices.length > 1) {
          violations.push({
            type: HardConstraintType.ROOM_CLASH,
            geneIndices: uniqueIndices,
            severity: uniqueIndices.length,
            description: `Classroom ${classroom?.name || classroomId} has ${uniqueIndices.length} lectures scheduled simultaneously in slot ${slotId}`,
            entityIds: [classroomId, slotId],
          });
        }
      }
    }
  }

  return violations;
}
