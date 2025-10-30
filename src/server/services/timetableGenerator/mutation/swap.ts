import type { Chromosome, GAInputData } from "../types";

/**
 * Perform swap mutation on a chromosome.
 */
export function swapMutation(
  chromosome: Chromosome,
  _inputData: GAInputData,
): Chromosome {
  // Deep copy to avoid modifying original
  const mutated = chromosome.map((gene) => ({ ...gene }));

  // Try to find two unlocked genes to swap
  const maxAttempts = 10;
  let swapped = false;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Select two random indices
    const i = Math.floor(Math.random() * mutated.length);
    let j = Math.floor(Math.random() * mutated.length);

    // Ensure i !== j
    while (j === i && mutated.length > 1) {
      j = Math.floor(Math.random() * mutated.length);
    }

    const gene1 = mutated[i]!;
    const gene2 = mutated[j]!;

    // Skip if either gene is locked
    if (gene1.isLocked || gene2.isLocked) {
      continue;
    }

    // Swap timeslot assignments only (classrooms are immutable)
    const tempTimeslot = gene1.timeslotId;
    gene1.timeslotId = gene2.timeslotId;
    gene2.timeslotId = tempTimeslot;

    swapped = true;
    break;
  }

  // If all genes are locked or only one gene, return unchanged
  if (!swapped) {
    return mutated;
  }

  return mutated;
}
