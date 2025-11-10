import { SoftConstraintType } from "../../types";
import type { Chromosome, GAInputData, SoftViolation } from "../../types";

/**
 * Check for room preferred unavailability: classroom used during preferred unavailable time.
 * This is a SOFT constraint - scheduling is allowed but penalized.
 *
 * Penalty: 5 points per violation
 */
export function checkRoomPreferredUnavailability(
  chromosome: Chromosome,
  inputData: GAInputData,
): SoftViolation[] {
  const violations: SoftViolation[] = [];
  const { lookupMaps, classrooms } = inputData;

  chromosome.forEach((gene, index) => {
    // Get the combined classrooms for this lecture
    const combinedClassrooms =
      lookupMaps.lectureToCombinedClassrooms.get(gene.lectureId) || [];

    // Check if any of the combined classrooms have preferred unavailability
    for (const classroomId of combinedClassrooms) {
      const classroom = classrooms.find((c) => c.id === classroomId);
      if (!classroom) continue;

      const isPreferredUnavailable = classroom.unavailableSlots.some(
        (unavailable) =>
          unavailable.slotId === gene.timeslotId && unavailable.isPreferred,
      );

      if (isPreferredUnavailable) {
        violations.push({
          type: SoftConstraintType.ROOM_PREFERRED_UNAVAILABLE,
          geneIndices: [index],
          penalty: 5, // Moderate penalty for preferred unavailability
          description: `Lecture ${gene.lectureId} uses classroom ${classroom?.name || classroomId} which is preferred unavailable during slot ${gene.timeslotId}`,
          entityIds: [classroomId, gene.timeslotId],
        });
      }
    }
  });

  return violations;
}
