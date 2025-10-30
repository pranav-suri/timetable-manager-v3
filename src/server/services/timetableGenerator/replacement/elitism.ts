import type { Population, FitnessResult } from "../types";

/**
 * Selects the elite individuals from the current population based on fitness.
 */
export function selectElites(
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
  // Avoid circular dependency on fitness.compare; replicate logic inline.
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
