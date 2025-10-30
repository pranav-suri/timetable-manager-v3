/**
 * Mutation Operator Module for Timetable Generator
 *
 * This module implements multi-strategy mutation for diversity maintenance
 * as described in Research Section 4.4.
 *
 * Key Features:
 * - Swap mutation (primary - 90%): Exchange assignments between two genes
 * - Random reset mutation (secondary - 10%): Completely reassign one gene
 * - Locked gene preservation: never modify pre-assigned slots
 * - Configurable mutation probability
 *
 * Purpose:
 * - Introduce random variation to maintain population diversity
 * - Escape local optima through larger jumps (random reset)
 * - Fine-tune solutions through smaller changes (swap)
 * - Prevent premature convergence
 *
 * Performance targets:
 * - Mutation: <5ms per chromosome
 */

import type { Chromosome, GAInputData, GAConfig } from "./types";

// ============================================================================
// SWAP MUTATION (Primary Strategy - 90%)
// ============================================================================

/**
 * Perform swap mutation on a chromosome.
 *
 * Algorithm:
 * 1. Select two random gene indices i and j
 * 2. If either gene is locked, try different pair (max 10 attempts)
 * 3. Swap their timeslot and classroom assignments
 * 4. Return mutated chromosome
 *
 * Why swap mutation?
 * - Preserves overall structure while introducing local perturbation
 * - Less disruptive than random reset
 * - Maintains good building blocks
 * - Fast exploration of nearby solutions
 *
 * Research reference: Section 4.4
 *
 * @param chromosome - Chromosome to mutate (will be cloned, not modified)
 * @param inputData - GA input data (not used but kept for consistency)
 * @returns Mutated chromosome with swapped assignments
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

    // Swap timeslot and classroom assignments
    const tempTimeslot = gene1.timeslotId;
    const tempClassroom = gene1.classroomId;

    gene1.timeslotId = gene2.timeslotId;
    gene1.classroomId = gene2.classroomId;

    gene2.timeslotId = tempTimeslot;
    gene2.classroomId = tempClassroom;

    swapped = true;
    break;
  }

  // If all genes are locked or only one gene, return unchanged
  if (!swapped) {
    return mutated;
  }

  return mutated;
}

// ============================================================================
// RANDOM RESET MUTATION (Secondary Strategy - 10%)
// ============================================================================

/**
 * Perform random reset mutation on a chromosome.
 *
 * Algorithm:
 * 1. Select one random gene index
 * 2. If gene is locked, try different gene (max 10 attempts)
 * 3. Assign completely new random values:
 *    - timeslotId = random from available slots
 *    - classroomId = random from allowed classrooms for this lecture
 * 4. Return mutated chromosome
 *
 * Why random reset mutation?
 * - Introduces larger jumps in search space
 * - Helps escape local optima
 * - Creates more diverse offspring
 * - Used less frequently because it's more disruptive
 *
 * Research reference: Section 4.4
 *
 * @param chromosome - Chromosome to mutate (will be cloned, not modified)
 * @param inputData - GA input data for accessing available slots and classrooms
 * @returns Mutated chromosome with one gene randomly reset
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

    // Get allowed classrooms for this lecture
    const allowedClassrooms =
      inputData.lookupMaps.lectureToAllowedClassrooms.get(gene.lectureId) || [];

    if (allowedClassrooms.length === 0) {
      // No allowed classrooms, skip this gene
      continue;
    }

    // Assign random slot
    const randomSlotIndex = Math.floor(Math.random() * inputData.slots.length);
    const randomSlot = inputData.slots[randomSlotIndex]!;

    // Assign random allowed classroom
    const randomClassroomIndex = Math.floor(
      Math.random() * allowedClassrooms.length,
    );
    const randomClassroomId = allowedClassrooms[randomClassroomIndex]!;

    // Update gene with new assignments
    gene.timeslotId = randomSlot.id;
    gene.classroomId = randomClassroomId;

    reset = true;
    break;
  }

  // If all genes are locked or no valid assignments found, return unchanged
  if (!reset) {
    return mutated;
  }

  return mutated;
}

// ============================================================================
// MAIN MUTATION FUNCTION
// ============================================================================

/**
 * Main mutation function with probability control and strategy selection.
 *
 * Algorithm:
 * 1. Check mutation probability:
 *    - If random() >= mutationProbability: return unchanged
 *    - Else: proceed with mutation
 * 2. Choose mutation strategy:
 *    - If random() < swapMutationRatio: use swap mutation (90%)
 *    - Else: use random reset mutation (10%)
 * 3. Return mutated chromosome
 *
 * Configuration:
 * - config.mutationProbability: Probability of mutation occurring (default 0.05)
 * - config.swapMutationRatio: Ratio of swap vs reset mutations (default 0.9)
 *
 * Research reference: Section 4.4
 *
 * @param chromosome - Chromosome to potentially mutate
 * @param inputData - GA input data for mutation operations
 * @param config - GA configuration with mutation parameters
 * @returns Mutated or unchanged chromosome
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

// ============================================================================
// ADAPTIVE MUTATION (Optional Enhancement - Future)
// ============================================================================

/**
 * Calculate adaptive mutation probability based on population diversity.
 *
 * This is an optional enhancement for future implementation.
 * The idea is to increase mutation rate when diversity is low
 * to prevent premature convergence.
 *
 * Algorithm:
 * 1. Measure population diversity (e.g., unique chromosome count / population size)
 * 2. If diversity < threshold: increase mutation probability
 * 3. If diversity > threshold: decrease mutation probability
 * 4. Return adjusted probability
 *
 * NOT CURRENTLY USED - Placeholder for future enhancement
 *
 * @param baseProbability - Base mutation probability from config
 * @param diversity - Current population diversity (0.0 to 1.0)
 * @returns Adjusted mutation probability
 */
export function adaptiveMutationProbability(
  baseProbability: number,
  diversity: number,
): number {
  // Simple linear adjustment
  const diversityThreshold = 0.5;

  if (diversity < diversityThreshold) {
    // Low diversity: increase mutation up to 2x base rate
    const multiplier = 1 + (diversityThreshold - diversity);
    return Math.min(baseProbability * multiplier, baseProbability * 2);
  } else {
    // High diversity: use base rate
    return baseProbability;
  }
}
