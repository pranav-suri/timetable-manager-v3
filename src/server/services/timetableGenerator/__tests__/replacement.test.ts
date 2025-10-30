/**
 * @file replacement.test.ts
 * @description Test suite for the elitism and replacement module.
 *
 * This file contains unit tests for the `performReplacement` function,
 * ensuring that elitism and population replacement work as expected.
 */

import { describe, it, assert, beforeEach } from "vitest";
import type {
  Chromosome,
  Population,
  FitnessResult,
  GAConfig,
  Gene,
} from "../types";
import { performReplacement } from "../replacement";

// Mock Data & Helpers

const createGene = (
  id: string,
  timeslotId: string,
  classroomId: string,
): Gene => ({
  lectureEventId: id,
  lectureId: `lec${id}`,
  timeslotId,
  classroomId,
  isLocked: false,
  duration: 1,
});

const createChromosome = (id: string): Chromosome => [
  createGene(`lec1-evt${id}`, `slot${id}`, `room${id}`),
  createGene(`lec2-evt${id}`, `slot${id}`, `room${id}`),
];

const createFitnessResult = (
  isFeasible: boolean,
  hardPenalty: number,
  softPenalty: number,
): FitnessResult => ({
  isFeasible,
  hardPenalty,
  softPenalty,
  totalPenalty: hardPenalty + softPenalty,
  fitnessScore: 1 / (1 + hardPenalty + softPenalty),
  hardViolations: [],
  softViolations: [],
  hardViolationCount: isFeasible ? 0 : 1,
  softViolationCount: 0,
});

let population: Population;
let fitnesses: FitnessResult[];
let offspring: Population;
let config: GAConfig;

describe("Replacement Logic", () => {
  beforeEach(() => {
    // Create a diverse population with varying fitness
    population = [
      createChromosome("0"), // Best (feasible, low soft penalty)
      createChromosome("1"), // Good (feasible, high soft penalty)
      createChromosome("2"), // Bad (infeasible, low hard penalty)
      createChromosome("3"), // Worst (infeasible, high hard penalty)
      createChromosome("4"), // Another feasible
    ];

    fitnesses = [
      createFitnessResult(true, 0, 10), // Best
      createFitnessResult(true, 0, 50), // Good
      createFitnessResult(false, 100, 10), // Bad
      createFitnessResult(false, 500, 10), // Worst
      createFitnessResult(true, 0, 20), // Another feasible
    ];

    offspring = [
      createChromosome("child1"),
      createChromosome("child2"),
      createChromosome("child3"),
      createChromosome("child4"),
      createChromosome("child5"),
    ];

    config = {
      populationSize: 5,
      maxGenerations: 100,
      crossoverProbability: 0.9,
      mutationProbability: 0.1,
      eliteCount: 1, // 1 elite (was elitismRate: 0.2)
      tournamentSize: 3,
      maxStagnantGenerations: 50,
      targetFitness: 0.95,
      maxExecutionTimeMs: 60000,
      heuristicInitRatio: 0.2,
      swapMutationRatio: 0.9,
      enableRepair: true,
      enableMemetic: false,
      enableParallel: false,
      stopOnFeasible: false,
      constraintWeights: {
        hardConstraintWeight: 1000,
        idleTime: 1,
        dailyDistribution: 1,
        consecutivePreference: 1,
        teacherDailyLimit: 1,
        teacherWeeklyLimit: 1,
        cognitiveLoad: 1,
      },
    };
  });

  it("should preserve the correct number of elites", () => {
    config.eliteCount = 2; // 2 elites
    config.populationSize = 5;

    const nextGeneration = performReplacement(
      population,
      fitnesses,
      offspring,
      config,
    );

    const bestChromosome = population[0]!;
    const secondBestChromosome = population[4]!;

    assert.deepStrictEqual(
      nextGeneration[0],
      bestChromosome,
      "The best individual should be the first elite",
    );
    assert.deepStrictEqual(
      nextGeneration[1],
      secondBestChromosome,
      "The second best individual should be the second elite",
    );
    assert.strictEqual(nextGeneration.length, config.populationSize);
  });

  it("should handle an elitism rate of 0", () => {
    config.eliteCount = 0;
    const nextGeneration = performReplacement(
      population,
      fitnesses,
      offspring,
      config,
    );

    assert.deepStrictEqual(
      nextGeneration,
      offspring,
      "The next generation should be composed entirely of offspring",
    );
    assert.strictEqual(nextGeneration.length, config.populationSize);
  });

  it("should handle an elitism rate of 1", () => {
    config.eliteCount = 5; // All 5 individuals are elite
    const nextGeneration = performReplacement(
      population,
      fitnesses,
      offspring,
      config,
    );

    const sortedPopulation = [
      population[0]!,
      population[4]!,
      population[1]!,
      population[2]!,
      population[3]!,
    ];

    assert.deepStrictEqual(
      nextGeneration,
      sortedPopulation,
      "The next generation should be the entire sorted current population",
    );
  });

  it("should correctly rank and select elites based on hierarchical fitness", () => {
    // 1. Feasible (soft penalty 10) - best
    // 2. Feasible (soft penalty 20)
    // 3. Feasible (soft penalty 50)
    // 4. Infeasible (hard penalty 100) - fourth best
    // 5. Infeasible (hard penalty 500) - worst

    config.eliteCount = 3; // 3 elites
    config.populationSize = 5;

    const nextGeneration = performReplacement(
      population,
      fitnesses,
      offspring,
      config,
    );

    assert.deepStrictEqual(nextGeneration[0], population[0]); // Elite 1
    assert.deepStrictEqual(nextGeneration[1], population[4]); // Elite 2
    assert.deepStrictEqual(nextGeneration[2], population[1]); // Elite 3
  });

  it("should fill the rest of the population with offspring", () => {
    config.eliteCount = 1; // 1 elite
    config.populationSize = 5;

    const nextGeneration = performReplacement(
      population,
      fitnesses,
      offspring,
      config,
    );

    assert.deepStrictEqual(nextGeneration[0], population[0]); // Elite
    assert.deepStrictEqual(nextGeneration[1], offspring[0]); // Offspring 1
    assert.deepStrictEqual(nextGeneration[2], offspring[1]); // Offspring 2
    assert.deepStrictEqual(nextGeneration[3], offspring[2]); // Offspring 3
    assert.deepStrictEqual(nextGeneration[4], offspring[3]); // Offspring 4
  });

  it("should maintain the correct population size", () => {
    config.populationSize = 10;
    config.eliteCount = 3; // 3 elites
    population = Array.from({ length: 10 }, (_, i) =>
      createChromosome(String(i)),
    );
    fitnesses = Array.from({ length: 10 }, () =>
      createFitnessResult(true, 0, 10),
    );
    offspring = Array.from({ length: 10 }, (_, i) =>
      createChromosome(`child${i}`),
    );

    const nextGeneration = performReplacement(
      population,
      fitnesses,
      offspring,
      config,
    );

    assert.strictEqual(nextGeneration.length, 10);
  });

  it("should throw an error if there are not enough offspring to fill the population", () => {
    config.populationSize = 10;
    config.eliteCount = 5; // 5 elites
    offspring = offspring.slice(0, 2); // Only 2 offspring

    assert.throws(
      () => performReplacement(population, fitnesses, offspring, config),
      "Could not create a new generation with the correct population size. Not enough offspring.",
    );
  });
});
