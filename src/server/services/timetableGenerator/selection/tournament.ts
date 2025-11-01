import { compareFitness } from "../fitness";
import type { FitnessResult, GAConfig, Population } from "../types";

/**
 * Select a single parent using tournament selection.
 */
export function tournamentSelection(
  population: Population,
  fitnessResults: FitnessResult[],
  tournamentSize: number,
): number {
  if (population.length === 0) {
    throw new Error("Cannot select from empty population");
  }

  if (tournamentSize < 2) {
    throw new Error("Tournament size must be at least 2");
  }

  if (tournamentSize > population.length) {
    throw new Error(
      `Tournament size (${tournamentSize}) cannot exceed population size (${population.length})`,
    );
  }

  // Randomly select tournament participants
  const tournamentIndices: number[] = [];
  const availableIndices = new Set(
    Array.from({ length: population.length }, (_, i) => i),
  );

  for (let i = 0; i < tournamentSize; i++) {
    // Convert set to array for random selection
    const indices = Array.from(availableIndices);
    const randomIndex = Math.floor(Math.random() * indices.length);
    const selectedIndex = indices[randomIndex]!;

    tournamentIndices.push(selectedIndex);
    availableIndices.delete(selectedIndex);
  }

  // Find the best individual in tournament using hierarchical comparison
  let bestIndex = tournamentIndices[0]!;
  let bestFitness = fitnessResults[bestIndex]!;

  for (let i = 1; i < tournamentIndices.length; i++) {
    const currentIndex = tournamentIndices[i]!;
    const currentFitness = fitnessResults[currentIndex]!;

    // Use hierarchical comparison from fitness module
    const comparisonResult = compareFitness(currentFitness, bestFitness);

    if (comparisonResult > 0) {
      // Current is better than best
      bestIndex = currentIndex;
      bestFitness = currentFitness;
    }
  }

  return bestIndex;
}

/**
 * Select multiple parents using tournament selection.
 */
export function selectParents(
  population: Population,
  fitnessResults: FitnessResult[],
  tournamentSize: number,
  count: number,
): number[] {
  const selectedIndices: number[] = [];

  for (let i = 0; i < count; i++) {
    const selectedIndex = tournamentSelection(
      population,
      fitnessResults,
      tournamentSize,
    );
    selectedIndices.push(selectedIndex);
  }

  return selectedIndices;
}

/**
 * Select parent pairs for crossover.
 */
export function selectParentPairs(
  population: Population,
  fitnessResults: FitnessResult[],
  config: GAConfig,
): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  const numPairs = Math.floor(config.populationSize / 2);

  for (let i = 0; i < numPairs; i++) {
    const parent1 = tournamentSelection(
      population,
      fitnessResults,
      config.tournamentSize,
    );
    const parent2 = tournamentSelection(
      population,
      fitnessResults,
      config.tournamentSize,
    );

    pairs.push([parent1, parent2]);
  }

  return pairs;
}
