/**
 * @file config.ts
 * @description Configuration management for the Genetic Algorithm.
 *
 * This module provides default configurations, validation, and merging logic
 * for all tunable parameters of the GA.
 */

import type { GAConfig, PartialGAConfig } from "./types";

/**
 * Default GA configuration based on empirical guidelines from research.
 */
export const DEFAULT_GA_CONFIG: GAConfig = {
  populationSize: 200,
  maxGenerations: 1000,
  crossoverProbability: 0.9,
  mutationProbability: 0.05,
  eliteCount: 4, // 2% of 200
  tournamentSize: 3,
  maxStagnantGenerations: 200,
  heuristicInitRatio: 0.2,
  swapMutationRatio: 0.9,
  targetFitness: 0.95,
  maxExecutionTimeMs: 600000, // 10 minutes
  enableRepair: true,
  enableMemetic: false,
  enableParallel: false,
  stopOnFeasible: false,
  constraintWeights: {
    hardConstraintWeight: 1000,
    idleTime: 5,
    consecutivePreference: 8,
    teacherDailyLimit: 10,
    teacherWeeklyLimit: 15,
    excessiveDailyLectures: 6,
    excessivelyEmptyDay: 4,
    excessivelyFilledDay: 4,
    multiDurationLate: 5,
    deprioritizedDay: 3,
    deprioritizedSlot: 200,
    deprioritizedDaySlot: 5,
    dailyDistribution: 5,
  },
};

/**
 * Preset for a very fast, low-quality generation.
 * Useful for quick validation.
 */
export const FAST_PRESET: PartialGAConfig = {
  populationSize: 50,
  maxGenerations: 100,
  maxStagnantGenerations: 20,
  eliteCount: 1,
};

/**
 * Preset for a balanced generation, providing good quality in reasonable time.
 */
export const BALANCED_PRESET: PartialGAConfig = {
  populationSize: 200,
  maxGenerations: 1000,
  maxStagnantGenerations: 100,
  eliteCount: 4,
};

/**
 * Preset for a thorough, high-quality generation.
 * Takes longer but explores the search space more completely.
 */
export const THOROUGH_PRESET: PartialGAConfig = {
  populationSize: 500,
  maxGenerations: 2500,
  maxStagnantGenerations: 250,
  eliteCount: 10,
};

/**
 * Merges a partial user-provided configuration with the default configuration.
 *
 * @param partialConfig - A partial GAConfig object.
 * @returns A complete, validated GAConfig object.
 */
export function mergeConfig(partialConfig?: PartialGAConfig): GAConfig {
  if (!partialConfig) {
    return { ...DEFAULT_GA_CONFIG };
  }

  const merged: GAConfig = {
    ...DEFAULT_GA_CONFIG,
    ...partialConfig,
    constraintWeights: {
      ...DEFAULT_GA_CONFIG.constraintWeights,
      ...partialConfig.constraintWeights,
    },
  };

  validateConfig(merged);
  return merged;
}

/**
 * Validates a GA configuration object.
 *
 * @param config - The GAConfig object to validate.
 * @throws Error if the configuration is invalid.
 */
export function validateConfig(config: GAConfig): void {
  if (config.populationSize < 10) {
    throw new Error("Population size must be at least 10.");
  }
  if (config.maxGenerations <= 0) {
    throw new Error("Max generations must be positive.");
  }
  if (config.crossoverProbability < 0 || config.crossoverProbability > 1) {
    throw new Error("Crossover probability must be between 0 and 1.");
  }
  if (config.mutationProbability < 0 || config.mutationProbability > 1) {
    throw new Error("Mutation probability must be between 0 and 1.");
  }
  if (config.eliteCount < 0 || config.eliteCount >= config.populationSize) {
    throw new Error(
      "Elite count must be non-negative and less than population size.",
    );
  }
  if (config.tournamentSize < 2) {
    throw new Error("Tournament size must be at least 2.");
  }
  if (config.maxStagnantGenerations <= 0) {
    throw new Error("Stagnation limit must be positive.");
  }
}
