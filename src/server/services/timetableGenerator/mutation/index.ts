import { swapMutation } from "./swap";
import { randomResetMutation } from "./randomReset";
import type { Chromosome, GAConfig, GAInputData } from "../types";

export { swapMutation } from "./swap";
export { randomResetMutation } from "./randomReset";
export { adaptiveMutationProbability } from "./helpers";

/**
 * Main mutation function with probability control and strategy selection.
 */
export function mutate(
  chromosome: Chromosome,
  inputData: GAInputData,
  config: GAConfig,
): Chromosome {
  // Check mutation probability
  if (Math.random() >= config.mutationProbability) {
    // No mutation - return deep copy of original
    return chromosome.map((gene) => ({ ...gene }));
  }

  // Choose mutation strategy based on swapMutationRatio
  if (Math.random() < config.swapMutationRatio) {
    // Swap mutation (90% by default)
    return swapMutation(chromosome, inputData);
  } else {
    // Random reset mutation (10% by default)
    return randomResetMutation(chromosome, inputData);
  }
}
