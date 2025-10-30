/**
 * Crossover Operator Module for Timetable Generator
 *
 * This module implements uniform crossover with integrated repair mechanism
 * as described in Research Section 4.3.
 *
 * Key Features:
 * - Uniform crossover: each gene independently selected from parents
 * - Locked gene preservation: never swap pre-assigned slots
 * - Integrated repair mechanism to reduce hard constraint violations
 * - Configurable crossover probability
 *
 * Performance targets:
 * - Crossover: <5ms per parent pair
 * - Repair: <20ms per chromosome
 */

import type { Chromosome, Gene, GAInputData, GAConfig } from "./types";
import { repairChromosome } from "./repair";

// ============================================================================
// UNIFORM CROSSOVER (Core Operator)
// ============================================================================

/**
 * Perform uniform crossover on two parent chromosomes.
 *
 * Algorithm:
 * 1. For each gene position i:
 *    - If gene is locked in either parent: use locked version in both offspring
 *    - Else: randomly choose which parent contributes to each offspring (50/50)
 * 2. Return two new offspring chromosomes
 *
 * Research reference: Section 4.3
 * Why uniform crossover? No positional bias - gene order doesn't represent time.
 *
 * @param parent1 - First parent chromosome
 * @param parent2 - Second parent chromosome
 * @param config - GA configuration (not used here but kept for consistency)
 * @returns Tuple of two offspring chromosomes
 */
export function uniformCrossover(
  parent1: Chromosome,
  parent2: Chromosome,
  _config: GAConfig,
): [Chromosome, Chromosome] {
  if (parent1.length !== parent2.length) {
    throw new Error(
      `Parent chromosomes must have same length: ${parent1.length} vs ${parent2.length}`,
    );
  }

  const offspring1: Chromosome = [];
  const offspring2: Chromosome = [];

  for (let i = 0; i < parent1.length; i++) {
    const gene1 = parent1[i]!;
    const gene2 = parent2[i]!;

    // Deep copy to avoid reference sharing
    let offspring1Gene: Gene;
    let offspring2Gene: Gene;

    // Special handling for locked genes
    if (gene1.isLocked || gene2.isLocked) {
      // If either gene is locked, both offspring get the locked version
      const lockedGene = gene1.isLocked ? gene1 : gene2;
      offspring1Gene = { ...lockedGene };
      offspring2Gene = { ...lockedGene };
    } else {
      // Random 50/50 choice for each offspring
      if (Math.random() < 0.5) {
        // Offspring1 gets gene1, Offspring2 gets gene2
        offspring1Gene = { ...gene1 };
        offspring2Gene = { ...gene2 };
      } else {
        // Offspring1 gets gene2, Offspring2 gets gene1
        offspring1Gene = { ...gene2 };
        offspring2Gene = { ...gene1 };
      }
    }

    offspring1.push(offspring1Gene);
    offspring2.push(offspring2Gene);
  }

  return [offspring1, offspring2];
}

// ============================================================================
// CROSSOVER WITH PROBABILITY CONTROL
// ============================================================================

/**
 * Main crossover function with probability control and repair integration.
 *
 * Algorithm:
 * 1. Check crossover probability
 *    - If random() >= crossoverProbability: return copies of parents (no crossover)
 *    - Else: proceed with crossover
 * 2. Perform uniform crossover
 * 3. If repair is enabled: repair both offspring
 * 4. Return offspring
 *
 * @param parent1 - First parent chromosome
 * @param parent2 - Second parent chromosome
 * @param inputData - Complete timetable input data (for repair)
 * @param config - GA configuration
 * @returns Tuple of two offspring chromosomes (may be repaired)
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
