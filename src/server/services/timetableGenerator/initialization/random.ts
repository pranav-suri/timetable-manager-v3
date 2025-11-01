import type { Chromosome, GAInputData, Gene } from "../types";

/**
 * Initialize a single chromosome with random assignments.
 */
export function initializeRandomChromosome(inputData: GAInputData): Chromosome {
  const chromosome: Chromosome = [];
  const { eventIds, lookupMaps, slots } = inputData;

  for (const eventId of eventIds) {
    const lecture = lookupMaps.eventToLecture.get(eventId);

    if (!lecture) {
      throw new Error(`Lecture not found for event ${eventId}`);
    }

    // Check if this event has a locked assignment
    const lockedAssignment = lookupMaps.lockedAssignments.get(eventId);

    let timeslotId: string;
    let isLocked = false;

    if (lockedAssignment) {
      // Use locked timeslot
      timeslotId = lockedAssignment.slotId;
      isLocked = true;
    } else {
      // Random timeslot
      timeslotId = selectRandomSlot(slots);
    }

    const gene: Gene = {
      lectureEventId: eventId,
      lectureId: lecture.id,
      timeslotId,
      isLocked,
      duration: lecture.duration,
    };

    chromosome.push(gene);
  }

  return chromosome;
}

/**
 * Select a random slot from available slots.
 */
function selectRandomSlot(slots: GAInputData["slots"]): string {
  const randomIndex = Math.floor(Math.random() * slots.length);
  return slots[randomIndex]!.id;
}
