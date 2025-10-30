import type { Chromosome, GAInputData } from "../types";

/**
 * Perform random reset mutation on a chromosome.
 */
export function randomResetMutation(
  chromosome: Chromosome,
  inputData: GAInputData,
): Chromosome {
  // Deep copy to avoid modifying original
  const mutated = chromosome.map((gene) => ({ ...gene }));

  // Try to find an unlocked gene to reset
  const MAX_ATTEMPTS = 10;
  let reset = false;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Select random gene index
    const index = Math.floor(Math.random() * mutated.length);
    const gene = mutated[index]!;

    // Skip if gene is locked
    if (gene.isLocked) {
      continue;
    }

    // Assign random slot
    const randomSlotIndex = Math.floor(Math.random() * inputData.slots.length);
    const randomSlot = inputData.slots[randomSlotIndex]!;

    // Update gene with new timeslot (classroom is immutable)
    gene.timeslotId = randomSlot.id;

    reset = true;
    break;
  }

  // If all genes are locked, return unchanged
  if (!reset) {
    return mutated;
  }

  return mutated;
}
