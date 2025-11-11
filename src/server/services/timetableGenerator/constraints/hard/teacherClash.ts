import { HardConstraintType, SlotOccupancyMap } from "../../types";
import type { Chromosome, GAInputData, HardViolation } from "../../types";

/**
 * Check for teacher clash: teacher assigned to multiple lectures simultaneously.
 * HC1 from research Section 1.2.1
 * This version uses a pre-computed slotOccupancyMap that accounts for lecture duration.
 */
export function checkTeacherClash(
  slotOccupancyMap: SlotOccupancyMap,
  chromosome: Chromosome,
  inputData: GAInputData,
): HardViolation[] {
  const violations: HardViolation[] = [];
  const { lookupMaps } = inputData;

  // Check each timeslot for teacher conflicts using the occupancy map
  for (const [slotId, occupyingGenes] of slotOccupancyMap) {
    if (occupyingGenes.length <= 1) continue; // No possible clash if only one gene occupies the slot

    const teacherToGenes = new Map<string, number[]>();

    // Group genes in this slot by teacher
    for (const gene of occupyingGenes) {
      const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
      if (!lecture) continue;

      const teacherId = lecture.teacherId;
      if (!teacherToGenes.has(teacherId)) {
        teacherToGenes.set(teacherId, []);
      }

      // Find the original index of this gene in the chromosome
      const geneIndex = chromosome.findIndex(cGene => cGene.lectureEventId === gene.lectureEventId);
      if (geneIndex !== -1) {
        teacherToGenes.get(teacherId)!.push(geneIndex);
      }
    }

    // Report violations for teachers with multiple assignments
    for (const [teacherId, indices] of teacherToGenes) {
      if (indices.length > 1) {
        const teacher = inputData.teachers.find((t) => t.id === teacherId);
        violations.push({
          type: HardConstraintType.TEACHER_CLASH,
          geneIndices: indices,
          severity: indices.length, // More clashes = higher severity
          description: `Teacher ${teacher?.name || teacherId} assigned to ${indices.length} lectures simultaneously in slot ${slotId} (duration accounted for)`,
          entityIds: [teacherId, slotId],
        });
      }
    }
  }

  return violations;
}
