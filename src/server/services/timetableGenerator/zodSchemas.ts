import { z } from "zod";

/**
 * Zod schema for deprioritized day-slot pairs
 */
const daySlotPairSchema = z.object({
  day: z.number().int().min(1).max(7),
  period: z.number().int().min(1),
});

/**
 * Zod schema for ConstraintWeights (partial)
 */
export const partialConstraintWeightsSchema = z
  .object({
    // Hard constraint base weight
    hardConstraintWeight: z.number().optional(),

    // Soft constraint weights
    idleTime: z.number().optional(),
    consecutivePreference: z.number().optional(),
    teacherDailyLimit: z.number().optional(),
    teacherWeeklyLimit: z.number().optional(),
    excessiveDailyLectures: z.number().optional(),

    // New soft constraint weights
    excessivelyEmptyDay: z.number().optional(),
    excessivelyFilledDay: z.number().optional(),
    multiDurationLate: z.number().optional(),
    dailyDistribution: z.number().optional(),
    deprioritizedDay: z.number().optional(),
    deprioritizedSlot: z.number().optional(),
    deprioritizedDaySlot: z.number().optional(),

    // Thresholds / options
    minLecturesPerDay: z.number().int().min(0).optional(),
    maxLecturesPerDay: z.number().int().min(1).optional(),
    multiDurationPreferredFraction: z.number().min(0).max(1).optional(),
    deprioritizedDays: z.array(z.number().int().min(1).max(7)).optional(),
    deprioritizedSlotNumbers: z.array(z.number().int().min(1)).optional(),
    deprioritizedDaySlots: z.array(daySlotPairSchema).optional(),
  })
  .optional();

/**
 * Zod schema for PartialGAConfig
 */
export const partialGAConfigSchema = z.object({
  // Population parameters
  populationSize: z.number().int().min(10).optional(),
  eliteCount: z.number().int().min(1).optional(),
  heuristicInitRatio: z.number().min(0).max(1).optional(),

  // Genetic operator probabilities
  crossoverProbability: z.number().min(0).max(1).optional(),
  mutationProbability: z.number().min(0).max(1).optional(),
  swapMutationRatio: z.number().min(0).max(1).optional(),

  // Selection parameters
  tournamentSize: z.number().int().min(2).optional(),

  // Termination conditions
  maxGenerations: z.number().int().min(1).optional(),
  maxStagnantGenerations: z.number().int().min(1).optional(),
  targetFitness: z.number().min(0).max(1).optional(),
  maxExecutionTimeMs: z.number().int().min(1000).optional(),

  // Constraint weights
  constraintWeights: partialConstraintWeightsSchema,

  // Advanced options
  enableRepair: z.boolean().optional(),
  enableMemetic: z.boolean().optional(),
  enableParallel: z.boolean().optional(),
  randomSeed: z.number().int().optional(),
  stopOnFeasible: z.boolean().optional(),
});
