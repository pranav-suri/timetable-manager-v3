import type { Chromosome, GAInputData, HardViolation } from "../../types";
import { HardConstraintType } from "../../types";

/**
 * Check for teacher clash: teacher assigned to multiple lectures simultaneously.
 * HC1 from research Section 1.2.1
 */
export function checkTeacherClash(
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

  // Check each timeslot for teacher conflicts
  for (const [slotId, geneIndices] of slotToGenes) {
    const teacherToGenes = new Map<string, number[]>();

    // Group genes in this slot by teacher
    for (const geneIndex of geneIndices) {
      const gene = chromosome[geneIndex];
      if (!gene) continue;
      const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
      if (!lecture) continue;

      const teacherId = lecture.teacherId;
      if (!teacherToGenes.has(teacherId)) {
        teacherToGenes.set(teacherId, []);
      }
      teacherToGenes.get(teacherId)!.push(geneIndex);
    }

    // Report violations for teachers with multiple assignments
    for (const [teacherId, indices] of teacherToGenes) {
      if (indices.length > 1) {
        const teacher = inputData.teachers.find((t) => t.id === teacherId);
        violations.push({
          type: HardConstraintType.TEACHER_CLASH,
          geneIndices: indices,
          severity: indices.length, // More clashes = higher severity
          description: `Teacher ${teacher?.name || teacherId} assigned to ${indices.length} lectures simultaneously in slot ${slotId}`,
          entityIds: [teacherId, slotId],
        });
      }
    }
  }

  return violations;
}
