import type { Chromosome, GAInputData, Gene } from "../types";

/**
 * Find a valid slot for a gene that doesn't create immediate clashes.
 * Strategy: try random slots until one doesn't create clash, up to MAX_SLOT_SEARCH_ATTEMPTS.
 */
export function findValidSlotForGene(
  gene: Gene,
  chromosome: Chromosome,
  inputData: GAInputData,
  MAX_SLOT_SEARCH_ATTEMPTS = 20,
): string | null {
  const { slots, lookupMaps } = inputData;
  const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);

  if (!lecture) return null;

  const teacherId = lecture.teacherId;
  const subdivisionIds =
    lookupMaps.eventToSubdivisions.get(gene.lectureEventId) || [];

  for (let attempt = 0; attempt < MAX_SLOT_SEARCH_ATTEMPTS; attempt++) {
    const randomSlotIndex = Math.floor(Math.random() * slots.length);
    const candidateSlot = slots[randomSlotIndex]!;
    const slotId = candidateSlot.id;

    // Check teacher availability
    const teacherUnavailable = lookupMaps.teacherUnavailable.get(teacherId);
    if (teacherUnavailable?.has(slotId)) {
      continue;
    }

    // Check subdivision availability
    let subdivisionUnavailable = false;
    for (const subdivisionId of subdivisionIds) {
      if (lookupMaps.subdivisionUnavailable.get(subdivisionId)?.has(slotId)) {
        subdivisionUnavailable = true;
        break;
      }
    }
    if (subdivisionUnavailable) {
      continue;
    }

    // Check if this would create a clash with existing assignments
    // (simple check: any other gene in this slot with same teacher/subdivision)
    let wouldCreateClash = false;
    for (const otherGene of chromosome) {
      if (otherGene.lectureEventId === gene.lectureEventId) continue;
      if (otherGene.timeslotId !== slotId) continue;

      const otherLecture = lookupMaps.eventToLecture.get(
        otherGene.lectureEventId,
      );
      if (!otherLecture) continue;

      // Teacher clash check
      if (otherLecture.teacherId === teacherId) {
        wouldCreateClash = true;
        break;
      }

      // Subdivision clash check
      const otherSubdivisions =
        lookupMaps.eventToSubdivisions.get(otherGene.lectureEventId) || [];
      const hasCommonSubdivision = subdivisionIds.some((sid) =>
        otherSubdivisions.includes(sid),
      );
      if (hasCommonSubdivision) {
        wouldCreateClash = true;
        break;
      }
    }

    if (!wouldCreateClash) {
      return slotId;
    }
  }

  return null; // No valid slot found
}
