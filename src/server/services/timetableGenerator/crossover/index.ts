import { repairChromosome } from "../repair";
import { uniformCrossover } from "./uniform";
import type { Chromosome, GAConfig, GAInputData } from "../types";

export { uniformCrossover } from "./uniform";

/**
 * Main crossover function with probability control and repair integration.
 */
export function crossover(
  parent1: Chromosome,
  parent2: Chromosome,
  inputData: GAInputData,
  config: GAConfig,
): [Chromosome, Chromosome] {
  // Check crossover probability
  if (Math.random() >= config.crossoverProbability) {
    // Don't perform crossover - return copies of parents
    return [
      parent1.map((gene) => ({ ...gene })),
      parent2.map((gene) => ({ ...gene })),
    ];
  }

  // Perform uniform crossover
  let [offspring1, offspring2] = uniformCrossover(parent1, parent2, config);

  // Apply repair if enabled
  if (config.enableRepair) {
    offspring1 = repairChromosome(offspring1, inputData, config);
    offspring2 = repairChromosome(offspring2, inputData, config);
  }

  return [offspring1, offspring2];
}
