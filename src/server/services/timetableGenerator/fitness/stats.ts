import type { FitnessResult } from "../types";

export interface PopulationFitnessStats {
  bestFitness: number;
  worstFitness: number;
  averageFitness: number;
  medianFitness: number;
  feasibleCount: number;
  feasibleRatio: number;
  averageHardViolations: number;
  averageSoftViolations: number;
}

/**
 * Calculate comprehensive fitness statistics for a population.
 */
export function calculatePopulationStats(
  fitnessResults: FitnessResult[],
): PopulationFitnessStats {
  if (fitnessResults.length === 0) {
    throw new Error("Cannot calculate stats for empty population");
  }

  // Sort fitness scores for median calculation
  const sortedScores = [...fitnessResults]
    .map((f) => f.fitnessScore)
    .sort((a, b) => a - b);

  const medianFitness =
    sortedScores.length % 2 === 0
      ? (sortedScores[sortedScores.length / 2 - 1]! +
          sortedScores[sortedScores.length / 2]!) /
        2
      : sortedScores[Math.floor(sortedScores.length / 2)]!;

  const bestFitness = Math.max(...fitnessResults.map((f) => f.fitnessScore));
  const worstFitness = Math.min(...fitnessResults.map((f) => f.fitnessScore));
  const averageFitness =
    fitnessResults.reduce((sum, f) => sum + f.fitnessScore, 0) /
    fitnessResults.length;

  const feasibleCount = fitnessResults.filter((f) => f.isFeasible).length;
  const feasibleRatio = feasibleCount / fitnessResults.length;

  const averageHardViolations =
    fitnessResults.reduce((sum, f) => sum + f.hardViolationCount, 0) /
    fitnessResults.length;
  const averageSoftViolations =
    fitnessResults.reduce((sum, f) => sum + f.softViolationCount, 0) /
    fitnessResults.length;

  return {
    bestFitness,
    worstFitness,
    averageFitness,
    medianFitness,
    feasibleCount,
    feasibleRatio,
    averageHardViolations,
    averageSoftViolations,
  };
}

/**
 * Check if a fitness result represents a perfect solution.
 */
export function isPerfectSolution(fitness: FitnessResult): boolean {
  return fitness.isFeasible && fitness.softViolationCount === 0;
}

/**
 * Check if a fitness result meets the target quality threshold.
 */
export function meetsTargetFitness(
  fitness: FitnessResult,
  targetFitness = 0.95,
): boolean {
  return fitness.fitnessScore >= targetFitness;
}
