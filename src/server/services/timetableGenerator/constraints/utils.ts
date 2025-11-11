import type { Chromosome, GAInputData, SlotOccupancyMap } from "../types";

/**
 * Builds a map of which genes occupy each timeslot, expanding for duration.
 * This is the core of the fix for multi-duration lecture clash detection.
 */
export function buildSlotOccupancyMap(chromosome: Chromosome, inputData: GAInputData): SlotOccupancyMap {
  const occupancyMap: SlotOccupancyMap = new Map();

  for (const gene of chromosome) {
    let currentSlotId: string | undefined = gene.timeslotId;

    // Add the gene to all slots it occupies based on its duration
    for (let i = 0; i < gene.duration; i++) {
      if (!currentSlotId) break; // Stop if we run off the end of the day

      // Add this gene to the occupancy list for the current slot
      if (!occupancyMap.has(currentSlotId)) {
        occupancyMap.set(currentSlotId, []);
      }
      occupancyMap.get(currentSlotId)!.push(gene);

      // Move to the next consecutive slot
      currentSlotId = inputData.lookupMaps.slotToNextSlotId.get(currentSlotId);
    }
  }
  return occupancyMap;
}
