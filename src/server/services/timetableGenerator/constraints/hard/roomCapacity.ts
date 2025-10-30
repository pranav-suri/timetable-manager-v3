import type { Chromosome, GAInputData, HardViolation } from "../../types";
import { HardConstraintType } from "../../types";

/**
 * Check for room capacity constraint: lecture assigned to combined classrooms with insufficient total capacity.
 * HC7 from research Section 1.2.1
 */
export function checkRoomCapacity(
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps } = inputData;

  chromosome.forEach((gene, index) => {
    // Get the combined classrooms for this lecture
    const combinedClassrooms =
      lookupMaps.lectureToCombinedClassrooms.get(gene.lectureId) || [];

    // Calculate total capacity of all combined classrooms
    let totalCapacity = 0;
    const classroomNames: string[] = [];

    for (const classroomId of combinedClassrooms) {
      const capacity = lookupMaps.classroomCapacity.get(classroomId) || 100;
      totalCapacity += capacity;
      const classroom = inputData.classrooms.find((c) => c.id === classroomId);
      if (classroom) classroomNames.push(classroom.name);
    }

    // Enrollment currently unknown (schema lacks subdivision size)
    const enrollment = 0; // Placeholder

    if (enrollment > totalCapacity) {
      violations.push({
        type: HardConstraintType.ROOM_CAPACITY,
        geneIndices: [index],
        severity: Math.ceil((enrollment - totalCapacity) / 10),
        description: `Lecture requires ${enrollment} seats but combined classrooms (${classroomNames.join(" + ")}) have total capacity ${totalCapacity}`,
        entityIds: [gene.lectureId, ...combinedClassrooms],
      });
    }
  });

  return violations;
}
