import type { Chromosome, GAInputData, Gene } from "../types";
import {
  findAllConsecutiveSlots,
  type ConsecutiveSlotBlock,
} from "../utils/slotUtils";

/**
 * Initialize a single chromosome with random assignments, respecting multi-duration constraints.
 *
 * Key improvement: For multi-duration lectures, randomly selects from valid consecutive blocks
 * instead of picking any random slot.
 */
export function initializeRandomChromosome(inputData: GAInputData): Chromosome {
  const chromosome: Chromosome = [];
  const { eventIds, lookupMaps } = inputData;

  // Pre-compute valid blocks for each duration to avoid repeated calculations
  const blocksByDuration = new Map<number, ConsecutiveSlotBlock[]>();

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
      // Random timeslot, but must be a valid start of a consecutive block
      if (lecture.duration <= 1) {
        // Single-slot lecture: any slot is valid
        timeslotId = selectRandomSlot(inputData);
      } else {
        // Multi-duration lecture: select from valid consecutive blocks
        if (!blocksByDuration.has(lecture.duration)) {
          blocksByDuration.set(
            lecture.duration,
            findAllConsecutiveSlots(lecture.duration, inputData),
          );
        }

        const validBlocks = blocksByDuration.get(lecture.duration)!;
        if (validBlocks.length === 0) {
          // No valid blocks, fallback to random slot (will be repaired later)
          console.warn(
            `No valid consecutive blocks for duration ${lecture.duration}, using fallback`,
          );
          timeslotId = selectRandomSlot(inputData);
        } else {
          // Randomly select from valid blocks
          const randomBlock =
            validBlocks[Math.floor(Math.random() * validBlocks.length)]!;
          timeslotId = randomBlock.startSlotId;
        }
      }
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
function selectRandomSlot(inputData: GAInputData): string {
  const randomIndex = Math.floor(Math.random() * inputData.slots.length);
  return inputData.slots[randomIndex]!.id;
}
