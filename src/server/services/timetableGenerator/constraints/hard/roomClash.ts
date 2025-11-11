import { HardConstraintType, SlotOccupancyMap } from "../../types";
import type { Chromosome, GAInputData, HardViolation } from "../../types";

/**
 * Check for room clash: lectures sharing combined classrooms in same timeslot.
 * HC3 from research Section 1.2.1
 *
 * NOTE: With immutable combined classrooms, a room clash occurs when two lectures
 * that share ANY classroom in their combinedClassrooms list are scheduled in the same slot.
 *
 * This version uses a pre-computed slotOccupancyMap that accounts for lecture duration.
 */
export function checkRoomClash(
  slotOccupancyMap: SlotOccupancyMap,
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps } = inputData;

  // Check each timeslot for classroom conflicts using the occupancy map
  for (const [slotId, occupyingGenes] of slotOccupancyMap) {
    if (occupyingGenes.length <= 1) continue; // No possible clash if only one gene occupies the slot

    // Build a map of classroomId -> gene indices using that classroom
    const classroomToGenes = new Map<string, number[]>();

    for (const gene of occupyingGenes) {
      // Get the combined classrooms for this lecture
      const combinedClassrooms =
        lookupMaps.lectureToCombinedClassrooms.get(gene.lectureId) || [];

      // Add this gene index to all its combined classrooms
      for (const classroomId of combinedClassrooms) {
        if (!classroomToGenes.has(classroomId)) {
          classroomToGenes.set(classroomId, []);
        }

        // Find the original index of this gene in the chromosome
        const geneIndex = chromosome.findIndex(cGene => cGene.lectureEventId === gene.lectureEventId);
        if (geneIndex !== -1) {
          classroomToGenes.get(classroomId)!.push(geneIndex);
        }
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
            description: `Classroom ${classroom?.name || classroomId} has ${uniqueIndices.length} lectures scheduled simultaneously in slot ${slotId} (duration accounted for)`,
            entityIds: [classroomId, slotId],
          });
        }
      }
    }
  }

  return violations;
}
