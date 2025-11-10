/**
 * @file adaptive.ts
 * @description Adaptive Mutation Probability Strategies
 *
 * Implements multiple strategies for dynamically adjusting mutation probability
 * during evolution to balance exploration vs. exploitation:
 *
 * 1. **Stagnation-Based**: Increase mutation when fitness stagnates
 * 2. **Diversity-Based**: Adjust based on population diversity (Hamming distance)
 * 3. **Fitness-Based**: Per-individual mutation based on fitness (Srinivas & Patnaik)
 * 4. **Hybrid**: Combination of stagnation and diversity strategies
 *
 * @see research: Srinivas, M., & Patnaik, L. M. (1994). Adaptive probabilities of
 * crossover and mutation in genetic algorithms. IEEE Transactions on Systems,
 * Man, and Cybernetics, 24(4), 656-667.
 */

import type {
  Chromosome,
  Population,
  FitnessResult,
  AdaptiveMutationConfig,
  AdaptiveMutationStrategy,
} from "../types";

// ============================================================================
// POPULATION DIVERSITY METRICS
// ============================================================================

/**
 * Calculate the average Hamming distance between chromosomes in the population.
 * Hamming distance = number of positions where two chromosomes differ.
 *
 * A high Hamming distance indicates high diversity (good exploration).
 * A low Hamming distance indicates convergence (potential premature convergence).
 *
 * @param population - Array of chromosomes
 * @returns Normalized diversity metric (0-1)
 *          0 = all identical, 1 = maximum diversity
 */
export function calculatePopulationDiversity(population: Population): number {
  if (population.length < 2) return 1.0; // Single individual = max diversity

  const chromosomeLength = population[0]!.length;
  let totalHammingDistance = 0;
  let comparisons = 0;

  // Sample-based diversity calculation for performance (don't compare all pairs)
  const sampleSize = Math.min(20, population.length);
  const step = Math.floor(population.length / sampleSize);

  for (let i = 0; i < population.length; i += step) {
    for (let j = i + step; j < population.length; j += step) {
      const hamming = hammingDistance(population[i]!, population[j]!);
      totalHammingDistance += hamming;
      comparisons++;
    }
  }

  if (comparisons === 0) return 1.0;

  // Normalize by chromosome length
  const avgHamming = totalHammingDistance / comparisons;
  const maxPossibleHamming = chromosomeLength; // All genes different

  return avgHamming / maxPossibleHamming;
}

/**
 * Calculate Hamming distance between two chromosomes.
 * Only compares timeslotId since that's what mutates (classrooms are immutable).
 *
 * @param chrom1 - First chromosome
 * @param chrom2 - Second chromosome
 * @returns Number of differing gene positions
 */
function hammingDistance(chrom1: Chromosome, chrom2: Chromosome): number {
  let distance = 0;
  const length = Math.min(chrom1.length, chrom2.length);

  for (let i = 0; i < length; i++) {
    if (chrom1[i]!.timeslotId !== chrom2[i]!.timeslotId) {
      distance++;
    }
  }

  return distance;
}

/**
 * Calculate the average fitness diversity in the population.
 * High fitness diversity = good mix of solutions, Low = converged
 *
 * @param fitnesses - Array of fitness results
 * @returns Normalized diversity (0-1), based on coefficient of variation
 */
export function calculateFitnessDiversity(fitnesses: FitnessResult[]): number {
  if (fitnesses.length < 2) return 1.0;

  const fitnessValues = fitnesses.map((f) => f.fitnessScore);
  const mean =
    fitnessValues.reduce((sum, val) => sum + val, 0) / fitnessValues.length;

  if (mean === 0) return 0.0;

  const variance =
    fitnessValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    fitnessValues.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation: stdDev / mean
  // Normalize to 0-1 range (higher CV = higher diversity)
  const cv = stdDev / mean;
  return Math.min(cv, 1.0);
}

// ============================================================================
// ADAPTIVE MUTATION STRATEGIES
// ============================================================================

/**
 * Calculate adaptive mutation probability using the stagnation-based strategy.
 *
 * **Strategy**: Increase mutation when fitness improvement stagnates.
 * - Low stagnation: Use base probability (exploitation)
 * - High stagnation: Increase probability (exploration - "hail mary")
 *
 * @param config - Adaptive mutation configuration
 * @param stagnationCount - Number of generations without improvement
 * @returns Adjusted mutation probability
 */
export function stagnationBasedMutation(
  config: AdaptiveMutationConfig,
  stagnationCount: number,
): number {
  const threshold = config.stagnationThreshold ?? 20;
  const multiplier = config.stagnationMultiplier ?? 1.5;

  if (stagnationCount >= threshold) {
    // Stagnation detected - increase mutation
    const increaseAmount = Math.floor(stagnationCount / threshold);
    const adjustedProbability =
      config.baseProbability * Math.pow(multiplier, increaseAmount);

    return Math.min(adjustedProbability, config.maxProbability);
  }

  // No stagnation - use base probability
  return config.baseProbability;
}

/**
 * Calculate adaptive mutation probability using the diversity-based strategy.
 *
 * **Strategy**: Adjust mutation based on population diversity.
 * - High diversity: Lower mutation (let good schemas form)
 * - Low diversity: Higher mutation (inject new genetic material)
 *
 * @param config - Adaptive mutation configuration
 * @param diversity - Population diversity metric (0-1)
 * @returns Adjusted mutation probability
 */
export function diversityBasedMutation(
  config: AdaptiveMutationConfig,
  diversity: number,
): number {
  const threshold = config.diversityThreshold ?? 0.3;
  const multiplier = config.diversityMultiplier ?? 2.0;

  if (diversity < threshold) {
    // Low diversity - increase mutation
    const diversityDeficit = (threshold - diversity) / threshold; // 0-1
    const adjustedProbability =
      config.baseProbability * (1 + diversityDeficit * (multiplier - 1));

    return Math.min(adjustedProbability, config.maxProbability);
  }

  // High diversity - use base or slightly reduced probability
  return config.baseProbability;
}

/**
 * Calculate per-individual mutation probability using fitness-based strategy.
 *
 * **Strategy** (Srinivas & Patnaik, 1994):
 * - High-fitness individuals: Low mutation (protect good genes)
 * - Low-fitness individuals: High mutation (aggressively explore)
 *
 * Formula for individual i with fitness F_i:
 * - If F_i > F_avg: P_m = P_m_high * (F_max - F_i) / (F_max - F_avg)
 * - If F_i ≤ F_avg: P_m = P_m_low
 *
 * @param config - Adaptive mutation configuration
 * @param individualFitness - Fitness of the individual
 * @param maxFitness - Best fitness in population
 * @param avgFitness - Average fitness in population
 * @returns Mutation probability for this individual
 */
export function fitnessBasedMutation(
  config: AdaptiveMutationConfig,
  individualFitness: number,
  maxFitness: number,
  avgFitness: number,
): number {
  const highProb = config.fitnessHighProbability ?? 0.01;
  const lowProb = config.fitnessLowProbability ?? 0.05;

  if (individualFitness > avgFitness) {
    // Above average - protect with low mutation
    if (maxFitness === avgFitness) return highProb;

    const ratio = (maxFitness - individualFitness) / (maxFitness - avgFitness);
    const probability = highProb + (lowProb - highProb) * ratio;

    return Math.max(
      config.minProbability,
      Math.min(probability, config.maxProbability),
    );
  } else {
    // Below average - aggressively mutate
    return Math.min(lowProb, config.maxProbability);
  }
}

/**
 * Calculate adaptive mutation probability using the hybrid strategy.
 *
 * **Strategy**: Combine stagnation and diversity signals.
 * - Use whichever signal suggests higher mutation (conservative)
 * - Ensures we adapt to both convergence and stagnation
 *
 * @param config - Adaptive mutation configuration
 * @param stagnationCount - Number of generations without improvement
 * @param diversity - Population diversity metric (0-1)
 * @returns Adjusted mutation probability
 */
export function hybridAdaptiveMutation(
  config: AdaptiveMutationConfig,
  stagnationCount: number,
  diversity: number,
): number {
  const stagnationProb = stagnationBasedMutation(config, stagnationCount);
  const diversityProb = diversityBasedMutation(config, diversity);

  // Take the maximum of the two strategies (more aggressive exploration)
  return Math.max(stagnationProb, diversityProb);
}

// ============================================================================
// MAIN ADAPTIVE MUTATION CONTROLLER
// ============================================================================

/**
 * Context for adaptive mutation calculation.
 */
export interface AdaptiveMutationContext {
  /** Current population */
  population: Population;
  /** Fitness results for population */
  fitnesses: FitnessResult[];
  /** Number of generations without improvement */
  stagnationCount: number;
  /** Optional: Individual index for fitness-based strategy */
  individualIndex?: number;
}

/**
 * Calculate the appropriate mutation probability based on configured strategy.
 *
 * This is the main entry point for adaptive mutation. Call this at the start
 * of each generation to get the mutation probability to use.
 *
 * @param config - Adaptive mutation configuration
 * @param context - Current GA state context
 * @returns Mutation probability to use (0-1)
 *
 * @example
 * ```typescript
 * const mutationProb = calculateAdaptiveMutationProbability(
 *   config.adaptiveMutation,
 *   {
 *     population,
 *     fitnesses,
 *     stagnationCount: generationsWithoutImprovement
 *   }
 * );
 *
 * // For fitness-based (per-individual):
 * for (let i = 0; i < offspring.length; i++) {
 *   const prob = calculateAdaptiveMutationProbability(
 *     config.adaptiveMutation,
 *     { population, fitnesses, stagnationCount, individualIndex: i }
 *   );
 *   offspring[i] = mutate(offspring[i], inputData, { ...config, mutationProbability: prob });
 * }
 * ```
 */
export function calculateAdaptiveMutationProbability(
  config: AdaptiveMutationConfig | undefined,
  context: AdaptiveMutationContext,
): number {
  // No adaptive mutation config - return default static probability
  if (!config) {
    return 0.05; // Default mutation probability
  }

  const { population, fitnesses, stagnationCount, individualIndex } = context;

  switch (config.strategy) {
    case "stagnation":
      return stagnationBasedMutation(config, stagnationCount);

    case "diversity": {
      const diversity = calculatePopulationDiversity(population);
      return diversityBasedMutation(config, diversity);
    }

    case "fitness": {
      // Fitness-based requires individual index
      if (individualIndex === undefined) {
        console.warn(
          "Fitness-based adaptive mutation requires individualIndex. Falling back to base probability.",
        );
        return config.baseProbability;
      }

      const individualFitness = fitnesses[individualIndex]?.fitnessScore ?? 0;
      const maxFitness = Math.max(...fitnesses.map((f) => f.fitnessScore));
      const avgFitness =
        fitnesses.reduce((sum, f) => sum + f.fitnessScore, 0) /
        fitnesses.length;

      return fitnessBasedMutation(
        config,
        individualFitness,
        maxFitness,
        avgFitness,
      );
    }

    case "hybrid": {
      const diversity = calculatePopulationDiversity(population);
      return hybridAdaptiveMutation(config, stagnationCount, diversity);
    }

    default:
      return config.baseProbability;
  }
}

/**
 * Get default adaptive mutation configuration for a given strategy.
 *
 * @param strategy - The adaptive mutation strategy to use
 * @returns Complete configuration with sensible defaults
 */
export function getDefaultAdaptiveMutationConfig(
  strategy: AdaptiveMutationStrategy,
): AdaptiveMutationConfig {
  const baseConfig: AdaptiveMutationConfig = {
    strategy,
    baseProbability: 0.01,
    maxProbability: 0.2,
    minProbability: 0.001,
    stagnationThreshold: 20,
    stagnationMultiplier: 1.5,
    diversityThreshold: 0.3,
    diversityMultiplier: 2.0,
    fitnessHighProbability: 0.01,
    fitnessLowProbability: 0.05,
    adaptCrossover: false,
  };

  // Strategy-specific tuning
  switch (strategy) {
    case "stagnation":
      return {
        ...baseConfig,
        stagnationThreshold: 15,
        stagnationMultiplier: 2.0,
      };

    case "diversity":
      return {
        ...baseConfig,
        diversityThreshold: 0.25,
        diversityMultiplier: 2.5,
      };

    case "fitness":
      return {
        ...baseConfig,
        fitnessHighProbability: 0.005,
        fitnessLowProbability: 0.08,
      };

    case "hybrid":
      return {
        ...baseConfig,
        stagnationThreshold: 20,
        stagnationMultiplier: 1.5,
        diversityThreshold: 0.3,
        diversityMultiplier: 2.0,
      };

    default:
      return baseConfig;
  }
}
