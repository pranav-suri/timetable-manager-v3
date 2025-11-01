import type { Chromosome, GAInputData, Gene } from "../types";

/**
 * Initialize a single chromosome using greedy heuristic.
 */
export function initializeHeuristicChromosome(
  inputData: GAInputData,
): Chromosome {
  const { eventIds, lookupMaps, slots } = inputData;

  // Create event metadata for sorting
  interface EventMeta {
    eventId: string;
    lectureId: string;
    lecture: GAInputData["lectures"][0];
    isLocked: boolean;
  }

  const eventMetas: EventMeta[] = eventIds.map((eventId) => {
    const lecture = lookupMaps.eventToLecture.get(eventId)!;
    const isLocked = lookupMaps.lockedAssignments.has(eventId);

    return {
      eventId,
      lectureId: lecture.id,
      lecture,
      isLocked,
    };
  });

  // Sort by constraints: locked first, then by duration
  eventMetas.sort((a, b) => {
    if (a.isLocked && !b.isLocked) return -1;
    if (!a.isLocked && b.isLocked) return 1;
    return b.lecture.duration - a.lecture.duration;
  });

  // Initialize partial chromosome with same order as eventIds
  const geneMap = new Map<string, Gene>();

  // Schedule events in priority order
  for (const meta of eventMetas) {
    const { eventId, lecture, isLocked } = meta;
    const lockedAssignment = lookupMaps.lockedAssignments.get(eventId);

    let timeslotId: string;

    if (lockedAssignment) {
      // Use locked assignment
      timeslotId = lockedAssignment.slotId;
    } else {
      // Heuristic: find slot with minimal conflicts
      const bestSlot = findBestSlotForEvent(
        eventId,
        lecture,
        Array.from(geneMap.values()),
        slots,
        lookupMaps,
      );
      timeslotId = bestSlot;
    }

    const gene: Gene = {
      lectureEventId: eventId,
      lectureId: lecture.id,
      timeslotId,
      isLocked,
      duration: lecture.duration,
    };

    geneMap.set(eventId, gene);
  }

  // Convert map back to ordered array
  const chromosome: Chromosome = eventIds.map(
    (eventId) => geneMap.get(eventId)!,
  );

  return chromosome;
}

/**
 * Find the best slot for an event by minimizing conflicts with already-scheduled genes.
 */
function findBestSlotForEvent(
  eventId: string,
  lecture: GAInputData["lectures"][0],
  scheduledGenes: Gene[],
  slots: GAInputData["slots"],
  lookupMaps: GAInputData["lookupMaps"],
): string {
  const teacherId = lecture.teacherId;
  const subdivisionIds = lookupMaps.eventToSubdivisions.get(eventId) || [];

  // Count conflicts for each slot
  const slotConflicts = new Map<string, number>();

  for (const slot of slots) {
    let conflicts = 0;

    // Check for conflicts with already-scheduled genes in this slot
    for (const gene of scheduledGenes) {
      if (gene.timeslotId === slot.id) {
        const otherLecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
        if (!otherLecture) continue;

        // Teacher conflict
        if (otherLecture.teacherId === teacherId) {
          conflicts += 10; // High penalty for teacher clash
        }

        // Subdivision conflict
        const otherSubdivisions = lookupMaps.eventToSubdivisions.get(
          gene.lectureEventId,
        );
        if (otherSubdivisions) {
          const hasOverlap = subdivisionIds.some((sid) =>
            otherSubdivisions.includes(sid),
          );
          if (hasOverlap) {
            conflicts += 10; // High penalty for subdivision clash
          }
        }
      }
    }

    slotConflicts.set(slot.id, conflicts);
  }

  // Find slot with minimum conflicts
  let bestSlotId = slots[0]!.id;
  let minConflicts = slotConflicts.get(bestSlotId) || 0;

  for (const slot of slots) {
    const conflicts = slotConflicts.get(slot.id) || 0;
    if (conflicts < minConflicts) {
      minConflicts = conflicts;
      bestSlotId = slot.id;
    }
  }

  return bestSlotId;
}
