/**
 * Fitness Function Module for Timetable Generator
 *
 * This module provides the fitness evaluation system for the Genetic Algorithm.
 * It implements a hierarchical penalty-based approach where hard constraints
 * are heavily weighted to ensure feasibility is prioritized over optimization.
 *
 * Key Features:
 * - Hierarchical penalty system (hard >> soft)
 * - Optional fitness caching for performance
 * - Chromosome comparison utilities for selection
 * - Fitness statistics tracking
 *
 * Based on Research Section 3: Fitness Function Design
 */

import type {
  Chromosome,
  GAInputData,
  FitnessResult,
  ConstraintWeights,
} from "./types";
import { evaluateChromosome, compareChromosomes } from "./constraints";

// ============================================================================
// CHROMOSOME HASHING FOR CACHE
// ============================================================================

/**
 * Generate a hash key for a chromosome for caching purposes.
 * Uses a simple string representation of gene assignments.
 *
 * Format: "lectureEventId:timeslotId:classroomId|..."
 */
function hashChromosome(chromosome: Chromosome): string {
  return chromosome
    .map(
      (gene) => `${gene.lectureEventId}:${gene.timeslotId}:${gene.classroomId}`,
    )
    .join("|");
}

// ============================================================================
// FITNESS CACHE
// ============================================================================

/**
 * Cache for storing fitness evaluations to avoid redundant calculations.
 * This is particularly useful when the same chromosome appears multiple times
 * in a population (e.g., due to elitism or identical mutations).
 *
 * The cache is generation-scoped and should be cleared between generations
 * to avoid unbounded memory growth.
 */
export class FitnessCache {
  private cache: Map<string, FitnessResult> = new Map();
  private hits = 0;
  private misses = 0;

  /**
   * Get fitness result from cache, or evaluate and cache if not present.
   */
  get(
    chromosome: Chromosome,
    inputData: GAInputData,
    weights: ConstraintWeights,
  ): FitnessResult {
    const key = hashChromosome(chromosome);
    const cached = this.cache.get(key);

    if (cached) {
      this.hits++;
      return cached;
    }

    this.misses++;
    const result = evaluateChromosome(chromosome, inputData, weights);
    this.cache.set(key, result);
    return result;
  }

  /**
   * Directly cache a fitness result (useful for external evaluation).
   */
  set(chromosome: Chromosome, result: FitnessResult): void {
    const key = hashChromosome(chromosome);
    this.cache.set(key, result);
  }

  /**
   * Clear the cache (should be called at start of each generation).
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics for performance monitoring.
   */
  getStats(): { size: number; hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }
}

// ============================================================================
// FITNESS EVALUATION WITH CACHING
// ============================================================================

/**
 * Evaluate the fitness of a chromosome with optional caching.
 *
 * This is the primary fitness evaluation function used throughout the GA.
 * It wraps the core evaluateChromosome function with caching support.
 *
 * @param chromosome - The chromosome to evaluate
 * @param inputData - Complete timetable input data
 * @param weights - Constraint weight configuration
 * @param cache - Optional fitness cache for performance
 * @returns Complete fitness evaluation result
 */
export function evaluateFitness(
  chromosome: Chromosome,
  inputData: GAInputData,
  weights: ConstraintWeights,
  cache?: FitnessCache,
): FitnessResult {
  if (cache) {
    return cache.get(chromosome, inputData, weights);
  }
  return evaluateChromosome(chromosome, inputData, weights);
}

/**
 * Evaluate fitness for an entire population.
 *
 * @param population - Array of chromosomes to evaluate
 * @param inputData - Complete timetable input data
 * @param weights - Constraint weight configuration
 * @param cache - Optional fitness cache for performance
 * @returns Array of fitness results (same order as population)
 */
export function evaluatePopulation(
  population: Chromosome[],
  inputData: GAInputData,
  weights: ConstraintWeights,
  cache?: FitnessCache,
): FitnessResult[] {
  return population.map((chromosome) =>
    evaluateFitness(chromosome, inputData, weights, cache),
  );
}

// ============================================================================
// CHROMOSOME COMPARISON
// ============================================================================

/**
 * Compare two chromosomes using hierarchical fitness rules.
 * This is the comparison function used in tournament selection.
 *
 * Returns:
 * - Positive number if chromosome1 is better than chromosome2
 * - Negative number if chromosome2 is better than chromosome1
 * - Zero if they are equally fit
 *
 * Hierarchical rules (from Research Section 3.2):
 * 1. Feasible solutions always beat infeasible solutions
 * 2. Among feasible solutions, lower soft penalty is better
 * 3. Among infeasible solutions, fewer hard violations is better
 * 4. If equal hard violations, lower total penalty is better
 */
export function compareFitness(
  fitness1: FitnessResult,
  fitness2: FitnessResult,
): number {
  return compareChromosomes(fitness1, fitness2);
}

/**
 * Find the best chromosome in a population according to fitness.
 *
 * @param population - Array of chromosomes
 * @param fitnessResults - Corresponding fitness results
 * @returns Index of the best chromosome
 */
export function findBestChromosome(
  population: Chromosome[],
  fitnessResults: FitnessResult[],
): number {
  if (population.length === 0) {
    throw new Error("Cannot find best chromosome in empty population");
  }

  let bestIndex = 0;
  let bestFitness = fitnessResults[0];

  for (let i = 1; i < population.length; i++) {
    if (compareFitness(fitnessResults[i]!, bestFitness!) > 0) {
      bestIndex = i;
      bestFitness = fitnessResults[i];
    }
  }

  return bestIndex;
}

/**
 * Find the worst chromosome in a population according to fitness.
 *
 * @param population - Array of chromosomes
 * @param fitnessResults - Corresponding fitness results
 * @returns Index of the worst chromosome
 */
export function findWorstChromosome(
  population: Chromosome[],
  fitnessResults: FitnessResult[],
): number {
  if (population.length === 0) {
    throw new Error("Cannot find worst chromosome in empty population");
  }

  let worstIndex = 0;
  let worstFitness = fitnessResults[0];

  for (let i = 1; i < population.length; i++) {
    if (compareFitness(fitnessResults[i]!, worstFitness!) < 0) {
      worstIndex = i;
      worstFitness = fitnessResults[i];
    }
  }

  return worstIndex;
}

// ============================================================================
// FITNESS STATISTICS
// ============================================================================

/**
 * Population fitness statistics for monitoring and logging.
 */
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
 *
 * @param fitnessResults - Array of fitness results for the population
 * @returns Statistical summary of population fitness
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
 * A perfect solution has no violations (hard or soft).
 */
export function isPerfectSolution(fitness: FitnessResult): boolean {
  return fitness.isFeasible && fitness.softViolationCount === 0;
}

/**
 * Check if a fitness result meets the target quality threshold.
 *
 * @param fitness - Fitness result to check
 * @param targetFitness - Target fitness threshold (default: 0.95)
 * @returns True if fitness meets or exceeds target
 */
export function meetsTargetFitness(
  fitness: FitnessResult,
  targetFitness = 0.95,
): boolean {
  return fitness.fitnessScore >= targetFitness;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Re-export from constraints for convenience
  evaluateChromosome,
  compareChromosomes,
};
