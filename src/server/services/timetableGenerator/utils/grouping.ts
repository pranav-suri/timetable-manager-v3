import type {
  Chromosome,
  GAInputData,
  GroupedEvent,
  GALecture,
  GASlot,
  Gene,
} from "../types";

export function groupEventsBySubdivisionAndDay(
  chromosome: Chromosome,
  input: GAInputData,
): Map<string, Map<number, GroupedEvent[]>> {
  const mapping = new Map<string, Map<number, GroupedEvent[]>>();

  chromosome.forEach((gene, geneIndex) => {
    const lecture = input.lookupMaps.eventToLecture.get(gene.lectureEventId);
    const slot = input.lookupMaps.slotIdToSlot.get(gene.timeslotId);
    if (!lecture || !slot) return;

    for (const lectureSubdivision of lecture.subdivisions) {
      const subdivisionId = lectureSubdivision.subdivisionId;
      if (!mapping.has(subdivisionId)) {
        mapping.set(subdivisionId, new Map<number, GroupedEvent[]>());
      }
      const dayMap = mapping.get(subdivisionId)!;

      if (!dayMap.has(slot.day)) {
        dayMap.set(slot.day, []);
      }
      dayMap.get(slot.day)!.push({ gene, lecture, slot, geneIndex });
    }
  });

  return mapping;
}
