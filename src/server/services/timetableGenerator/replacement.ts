/**
 * @file replacement.ts
 * @description Implements elitism and population replacement strategies.
 *
 * This module contains the logic for creating a new generation from the
 * current population and the newly generated offspring. It ensures that the
 * best-performing individuals (elites) from the current generation are
 * carried over to the next, guaranteeing that the best solution found so far
 * is never lost.
 *
 * @see research.md section 4.5 "Elitism and Replacement"
 *
 * ## Performance Targets
 * - Elitism selection: <1ms
 * - Replacement: <1ms
 */

import type { Population, FitnessResult, GAConfig } from "./types";

/**
 * Selects the elite individuals from the current population based on fitness.
 *
 * Elites are the best-performing individuals in a generation. Preserving them
 * ensures that the GA's progress is monotonic, i.e., the best fitness in the
 * population will never decrease from one generation to the next.
 *
 * @param population - The current population of chromosomes.
 * @param fitnesses - An array of fitness results corresponding to the population.
 * @param eliteCount - The number of elite individuals to select.
 * @returns An array containing the elite chromosomes.
 */
function selectElites(
  population: Population,
  fitnesses: FitnessResult[],
  eliteCount: number,
): Population {
  if (eliteCount === 0) {
    return [];
  }

  // Create an array of [chromosome, fitness] pairs to sort
  const populationWithFitness = population.map((chromosome, index) => ({
    chromosome,
    fitness: fitnesses[index]!,
  }));

  // Sort the population by fitness in descending order (best first)
  // The compare function in fitness.ts is not used here to avoid circular dependency
  // and because a direct sort is simpler.
  populationWithFitness.sort((a, b) => {
    // Feasible solutions are always better than infeasible ones
    if (a.fitness.isFeasible && !b.fitness.isFeasible) return -1;
    if (!a.fitness.isFeasible && b.fitness.isFeasible) return 1;

    // For two infeasible solutions, the one with the lower hard penalty is better
    if (!a.fitness.isFeasible) {
      return a.fitness.hardPenalty - b.fitness.hardPenalty;
    }

    // For two feasible solutions, the one with the lower soft penalty is better
    return a.fitness.softPenalty - b.fitness.softPenalty;
  });

  // Extract the top `eliteCount` chromosomes
  return populationWithFitness.slice(0, eliteCount).map((p) => p.chromosome);
}

/**
 * Creates the next generation by combining elites and offspring.
 *
 * This function implements the replacement strategy. It takes the best
 * individuals from the current generation (elites) and fills the rest of
 * the new population with the offspring generated through crossover and
 * mutation.
 *
 * @param population - The current population.
 * @param fitnesses - Fitness results for the current population.
 * @param offspring - The offspring generated for the next generation.
 * @param config - The GA configuration, containing the elitism rate.
 * @returns The new population for the next generation.
 */
export function performReplacement(
  population: Population,
  fitnesses: FitnessResult[],
  offspring: Population,
  config: GAConfig,
): Population {
  const { populationSize, eliteCount } = config;

  // 1. Select the elites from the current population
  const elites = selectElites(population, fitnesses, eliteCount);

  // 2. Fill the rest of the population with offspring
  const offspringCount = populationSize - eliteCount;
  const nextGeneration = [...elites, ...offspring.slice(0, offspringCount)];

  // Ensure the population size is maintained
  if (nextGeneration.length !== populationSize) {
    // This might happen if offspring generation is smaller than required.
    // Fill remaining spots from offspring, or throw error if not enough.
    console.warn(
      `Population size mismatch. Expected ${populationSize}, got ${nextGeneration.length}. Adjusting...`,
    );
    while (nextGeneration.length < populationSize && offspring.length > 0) {
      // This fallback is simplistic. A better approach might be to randomly sample from offspring.
      nextGeneration.push(offspring.pop()!);
    }
    if (nextGeneration.length !== populationSize) {
      throw new Error(
        `Could not create a new generation with the correct population size. Not enough offspring.`,
      );
    }
  }

  return nextGeneration;
}
