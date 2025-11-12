import type { Chromosome, GAInputData, Gene } from "../types";
import { SlotOccupancyTracker } from "../utils/slotOccupancy";
import {
  findAllConsecutiveSlots,
  getConsecutiveBlockFromStart,
} from "../utils/slotUtils";

/**
 * Initialize a single chromosome using greedy heuristic with multi-duration awareness.
 *
 * Key improvements:
 * 1. Uses SlotOccupancyMap for O(1) conflict checking instead of O(n²) iteration
 * 2. Treats multi-duration lectures as atomic blocks
 * 3. Finds valid consecutive slot blocks for lectures with duration > 1
 */
export function initializeHeuristicChromosome(
  inputData: GAInputData,
): Chromosome {
  const { eventIds, lookupMaps } = inputData;

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

  // Sort by constraints: locked first, then by duration (longer first)
  eventMetas.sort((a, b) => {
    if (a.isLocked && !b.isLocked) return -1;
    if (!a.isLocked && b.isLocked) return 1;
    return b.lecture.duration - a.lecture.duration;
  });

  // Initialize occupancy tracker for O(1) conflict checking
  const occupancyTracker = new SlotOccupancyTracker(inputData);

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

      // Verify it's a valid block start for multi-duration lectures
      const block = getConsecutiveBlockFromStart(
        timeslotId,
        lecture.duration,
        inputData,
      );

      if (!block) {
        // Locked slot is invalid for this duration, fall back to finding a valid block
        console.warn(
          `Locked slot ${timeslotId} is invalid for lecture ${lecture.id} with duration ${lecture.duration}`,
        );
        timeslotId = findBestBlockForEvent(
          eventId,
          lecture,
          occupancyTracker,
          inputData,
        );
      }
    } else {
      // Heuristic: find best consecutive block with minimal conflicts
      timeslotId = findBestBlockForEvent(
        eventId,
        lecture,
        occupancyTracker,
        inputData,
      );
    }

    const gene: Gene = {
      lectureEventId: eventId,
      lectureId: lecture.id,
      timeslotId,
      isLocked,
      duration: lecture.duration,
    };

    geneMap.set(eventId, gene);

    // Update occupancy tracker with this placement
    const block = getConsecutiveBlockFromStart(
      timeslotId,
      lecture.duration,
      inputData,
    );
    if (block) {
      occupancyTracker.addBlock(gene, block);
    } else {
      // Fallback: just add the single slot (shouldn't happen if findBestBlockForEvent works)
      occupancyTracker.addGene(gene);
    }
  }

  // Convert map back to ordered array
  const chromosome: Chromosome = eventIds.map(
    (eventId) => geneMap.get(eventId)!,
  );

  return chromosome;
}

/**
 * Find the best consecutive block for an event by minimizing conflicts.
 * Uses SlotOccupancyTracker for O(1) conflict checking (vs. O(n²) in old implementation).
 *
 * @param eventId - The event ID to schedule
 * @param lecture - The lecture data
 * @param occupancyTracker - Current slot occupancy state
 * @param inputData - The GA input data
 * @returns The starting slot ID of the best block
 */
function findBestBlockForEvent(
  eventId: string,
  lecture: GAInputData["lectures"][0],
  occupancyTracker: SlotOccupancyTracker,
  inputData: GAInputData,
): string {
  // Find all valid consecutive blocks for this lecture's duration
  const allBlocks = findAllConsecutiveSlots(lecture.duration, inputData);

  if (allBlocks.length === 0) {
    // No valid blocks found, fallback to first slot
    console.warn(
      `No valid consecutive blocks for lecture ${lecture.id} with duration ${lecture.duration}`,
    );
    return inputData.slots[0]!.id;
  }

  // Use occupancy tracker to find blocks with fewest conflicts (O(1) per block check)
  const validBlocks = occupancyTracker.findValidBlocks(
    lecture,
    eventId,
    allBlocks,
  );

  if (validBlocks.length > 0) {
    // Return the best block (fewest conflicts)
    return validBlocks[0]!.startSlotId;
  }

  // No conflict-free blocks found, use the first available block
  // (repair will fix conflicts later)
  return allBlocks[0]!.startSlotId;
}
