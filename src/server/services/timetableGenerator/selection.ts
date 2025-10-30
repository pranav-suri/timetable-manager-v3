/**
 * Selection Operator Module for Timetable Generator
 *
 * This module implements tournament selection with niched-penalty comparison.
 * Tournament selection provides a balance between selective pressure and diversity.
 *
 * Based on Research Section 4.2
 */

import type { Population, FitnessResult, GAConfig } from "./types";
import { compareFitness } from "./fitness";

// ============================================================================
// TOURNAMENT SELECTION
// ============================================================================

/**
 * Select a single parent using tournament selection.
 *
 * Algorithm:
 * 1. Randomly select k individuals from population (k = tournament size)
 * 2. Compare fitness of all tournament participants using hierarchical rules
 * 3. Return the individual with best fitness as winner
 *
 * @param population - Current population
 * @param fitnessResults - Fitness results for each individual
 * @param tournamentSize - Number of individuals in each tournament
 * @returns Index of selected parent in population
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
 *
 * This is a convenience function that calls tournamentSelection multiple times.
 * Each selection is independent, so the same individual can be selected multiple times.
 *
 * @param population - Current population
 * @param fitnessResults - Fitness results for each individual
 * @param tournamentSize - Number of individuals in each tournament
 * @param count - Number of parents to select
 * @returns Array of selected parent indices
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
 *
 * Each pair consists of two parents selected via tournament selection.
 * The number of pairs generated is populationSize / 2.
 *
 * @param population - Current population
 * @param fitnessResults - Fitness results for each individual
 * @param config - GA configuration
 * @returns Array of parent pairs (each pair is [parent1Index, parent2Index])
 */
export function selectParentPairs(
  population: Population,
  fitnessResults: FitnessResult[],
  config: GAConfig,
): [number, number][] {
  const pairs: [number, number][] = [];
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

// ============================================================================
// SELECTION STATISTICS
// ============================================================================

/**
 * Statistics about selection pressure and diversity.
 */
export interface SelectionStats {
  uniqueParentsSelected: number; // Number of unique individuals selected
  mostSelectedIndex: number; // Index of most frequently selected individual
  mostSelectedCount: number; // Number of times most selected individual was chosen
  selectionDiversity: number; // Ratio of unique selections to total selections (0-1)
}

/**
 * Calculate selection statistics for monitoring diversity.
 *
 * @param selectedIndices - Array of selected parent indices
 * @param populationSize - Size of population
 * @returns Selection statistics
 */
export function calculateSelectionStats(
  selectedIndices: number[],
  populationSize: number,
): SelectionStats {
  if (selectedIndices.length === 0) {
    throw new Error("Cannot calculate stats for empty selection");
  }

  // Count frequency of each selection
  const selectionCounts = new Map<number, number>();

  for (const index of selectedIndices) {
    const count = selectionCounts.get(index) || 0;
    selectionCounts.set(index, count + 1);
  }

  // Find most selected individual
  let mostSelectedIndex = selectedIndices[0]!;
  let mostSelectedCount = selectionCounts.get(mostSelectedIndex) || 0;

  for (const [index, count] of selectionCounts) {
    if (count > mostSelectedCount) {
      mostSelectedIndex = index;
      mostSelectedCount = count;
    }
  }

  const uniqueParentsSelected = selectionCounts.size;
  const selectionDiversity = uniqueParentsSelected / populationSize;

  return {
    uniqueParentsSelected,
    mostSelectedIndex,
    mostSelectedCount,
    selectionDiversity,
  };
}

// ============================================================================
// ALTERNATIVE SELECTION METHODS (for future enhancements)
// ============================================================================

/**
 * Roulette wheel selection (fitness-proportionate selection).
 * This is an alternative to tournament selection, but less commonly used
 * for constrained problems due to scaling issues.
 *
 * @param population - Current population
 * @param fitnessResults - Fitness results for each individual
 * @returns Index of selected individual
 */
export function rouletteWheelSelection(
  population: Population,
  fitnessResults: FitnessResult[],
): number {
  if (population.length === 0) {
    throw new Error("Cannot select from empty population");
  }

  // Calculate total fitness
  const totalFitness = fitnessResults.reduce(
    (sum, f) => sum + f.fitnessScore,
    0,
  );

  if (totalFitness === 0) {
    // All fitness scores are zero, select randomly
    return Math.floor(Math.random() * population.length);
  }

  // Generate random value between 0 and totalFitness
  const randomValue = Math.random() * totalFitness;

  // Find individual corresponding to random value
  let cumulativeFitness = 0;
  for (let i = 0; i < population.length; i++) {
    cumulativeFitness += fitnessResults[i]!.fitnessScore;
    if (cumulativeFitness >= randomValue) {
      return i;
    }
  }

  // Fallback (should never reach here)
  return population.length - 1;
}

/**
 * Rank-based selection.
 * Individuals are selected based on their rank rather than raw fitness.
 * This provides more consistent selection pressure.
 *
 * @param population - Current population
 * @param fitnessResults - Fitness results for each individual
 * @returns Index of selected individual
 */
export function rankBasedSelection(
  population: Population,
  fitnessResults: FitnessResult[],
): number {
  if (population.length === 0) {
    throw new Error("Cannot select from empty population");
  }

  // Create array of indices and sort by fitness
  const indices = Array.from({ length: population.length }, (_, i) => i);
  indices.sort((a, b) => {
    const fitnessA = fitnessResults[a]!;
    const fitnessB = fitnessResults[b]!;
    return compareFitness(fitnessB, fitnessA); // Sort descending
  });

  // Assign ranks (1 to N)
  const ranks = new Map<number, number>();
  indices.forEach((index, rank) => {
    ranks.set(index, rank + 1);
  });

  // Calculate total rank
  const totalRank = (population.length * (population.length + 1)) / 2;

  // Generate random value
  const randomValue = Math.random() * totalRank;

  // Select based on rank
  let cumulativeRank = 0;
  for (let i = 0; i < population.length; i++) {
    const index = indices[i]!;
    const rank = ranks.get(index)!;
    cumulativeRank += rank;

    if (cumulativeRank >= randomValue) {
      return index;
    }
  }

  // Fallback
  return population.length - 1;
}
