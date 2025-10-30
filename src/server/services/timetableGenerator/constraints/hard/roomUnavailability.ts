import type { Chromosome, GAInputData, HardViolation } from "../../types";
import { HardConstraintType } from "../../types";

/**
 * Check for room unavailability: any combined classroom used during unavailable time.
 * HC6 from research Section 1.2.1
 */
export function checkRoomUnavailability(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps, classrooms } = inputData;

  chromosome.forEach((gene, index) => {
    // Get the combined classrooms for this lecture
    const combinedClassrooms =
      lookupMaps.lectureToCombinedClassrooms.get(gene.lectureId) || [];

    // Check if any of the combined classrooms are unavailable
    for (const classroomId of combinedClassrooms) {
      const unavailableSlots = lookupMaps.classroomUnavailable.get(classroomId);

      if (unavailableSlots?.has(gene.timeslotId)) {
        const classroom = classrooms.find((c) => c.id === classroomId);
        violations.push({
          type: HardConstraintType.ROOM_UNAVAILABLE,
          geneIndices: [index],
          severity: 1,
          description: `Lecture ${gene.lectureId} uses classroom ${classroom?.name || classroomId} which is unavailable during slot ${gene.timeslotId}`,
          entityIds: [classroomId, gene.timeslotId],
        });
      }
    }
  });

  return violations;
}
