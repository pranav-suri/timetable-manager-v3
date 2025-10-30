/**
 * Unit tests for Fitness Evaluation
 *
 * This test file validates the fitness caching and evaluation infrastructure.
 * Run with: node --import tsx --test src/server/services/timetableGenerator/__tests__/fitness.test.ts
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { Chromosome, GAInputData } from "../types";
import { DEFAULT_GA_CONFIG } from "../config";
import {
  FitnessCache,
  evaluateFitness,
  evaluatePopulation,
  compareFitness,
} from "../fitness";

// ============================================================================
// MOCK DATA CREATION
// ============================================================================

/**
 * Create minimal mock input data for testing
 */
function createMockInputData(): GAInputData {
  return {
    timetableId: "test-tt",
    lectures: [],
    teachers: [],
    subdivisions: [],
    classrooms: [
      {
        id: "room1",
        name: "Room 1",
        timetableId: "test-tt",
        unavailableSlots: [],
      },
    ],
    slots: [
      {
        id: "slot1",
        day: 0,
        number: 1,
        timetableId: "test-tt",
        createdAt: new Date(),
      },
      {
        id: "slot2",
        day: 0,
        number: 2,
        timetableId: "test-tt",
        createdAt: new Date(),
      },
    ],
    eventIds: ["evt1", "evt2"],
    totalEvents: 2,
    lookupMaps: {
      teacherToLectures: new Map(),
      subdivisionToLectures: new Map(),
      lectureToSubdivisions: new Map(),
      lectureToAllowedClassrooms: new Map(),
      eventToLecture: new Map(),
      eventToSubdivisions: new Map(),
      teacherUnavailable: new Map(),
      subdivisionUnavailable: new Map(),
      classroomUnavailable: new Map(),
      slotIdToSlot: new Map(),
      slotLinearization: new Map(),
      linearToSlotId: new Map(),
      classroomIdToClassroom: new Map(),
      classroomCapacity: new Map(),
      lockedAssignments: new Map(),
    },
  };
}

/**
 * Create a test chromosome
 */
function createTestChromosome(): Chromosome {
  return [
    {
      lectureEventId: "evt1",
      lectureId: "lec1",
      timeslotId: "slot1",
      classroomId: "room1",
      isLocked: false,
      duration: 1,
    },
    {
      lectureEventId: "evt2",
      lectureId: "lec2",
      timeslotId: "slot2",
      classroomId: "room1",
      isLocked: false,
      duration: 1,
    },
  ];
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

describe("Fitness Evaluation", () => {
  test("FitnessCache stores and retrieves results", () => {
    const cache = new FitnessCache();
    const inputData = createMockInputData();
    const chromosome = createTestChromosome();
    const weights = DEFAULT_GA_CONFIG.constraintWeights;

    // First call should be a cache miss
    const result1 = cache.get(chromosome, inputData, weights);
    assert.ok(result1, "Should return a fitness result");

    const stats1 = cache.getStats();
    assert.strictEqual(stats1.misses, 1, "Should have 1 miss");
    assert.strictEqual(stats1.hits, 0, "Should have 0 hits");

    // Second call should be a cache hit
    const result2 = cache.get(chromosome, inputData, weights);
    assert.deepStrictEqual(result2, result1, "Should return cached result");

    const stats2 = cache.getStats();
    assert.strictEqual(stats2.misses, 1, "Should still have 1 miss");
    assert.strictEqual(stats2.hits, 1, "Should now have 1 hit");
  });

  test("FitnessCache clear resets cache", () => {
    const cache = new FitnessCache();
    const inputData = createMockInputData();
    const chromosome = createTestChromosome();
    const weights = DEFAULT_GA_CONFIG.constraintWeights;

    // Cache a result
    cache.get(chromosome, inputData, weights);

    const statsBefore = cache.getStats();
    assert.ok(statsBefore.size > 0, "Cache should have entries");

    // Clear cache
    cache.clear();

    const statsAfter = cache.getStats();
    assert.strictEqual(statsAfter.size, 0, "Cache should be empty");
    assert.strictEqual(statsAfter.hits, 0, "Hits should be reset");
    assert.strictEqual(statsAfter.misses, 0, "Misses should be reset");
  });

  test("FitnessCache distinguishes different chromosomes", () => {
    const cache = new FitnessCache();
    const inputData = createMockInputData();
    const weights = DEFAULT_GA_CONFIG.constraintWeights;

    const chromosome1 = createTestChromosome();
    const chromosome2: Chromosome = [
      {
        lectureEventId: "evt1",
        lectureId: "lec1",
        timeslotId: "slot2", // Different slot
        classroomId: "room1",
        isLocked: false,
        duration: 1,
      },
      {
        lectureEventId: "evt2",
        lectureId: "lec2",
        timeslotId: "slot1", // Different slot
        classroomId: "room1",
        isLocked: false,
        duration: 1,
      },
    ];

    cache.get(chromosome1, inputData, weights);
    cache.get(chromosome2, inputData, weights);

    const stats = cache.getStats();
    assert.strictEqual(stats.size, 2, "Should cache 2 different chromosomes");
    assert.strictEqual(stats.misses, 2, "Both should be cache misses");
  });

  test("FitnessCache set method adds result directly", () => {
    const cache = new FitnessCache();
    const chromosome = createTestChromosome();

    const mockResult = {
      totalPenalty: 100,
      fitnessScore: 0.5,
      isFeasible: true,
      hardPenalty: 0,
      softPenalty: 100,
      hardViolations: [],
      softViolations: [],
      hardViolationCount: 0,
      softViolationCount: 5,
    };

    cache.set(chromosome, mockResult);

    const stats = cache.getStats();
    assert.strictEqual(stats.size, 1, "Should have 1 cached entry");
  });

  test("FitnessCache calculates hit rate correctly", () => {
    const cache = new FitnessCache();
    const inputData = createMockInputData();
    const chromosome = createTestChromosome();
    const weights = DEFAULT_GA_CONFIG.constraintWeights;

    // 1 miss
    cache.get(chromosome, inputData, weights);
    // 3 hits
    cache.get(chromosome, inputData, weights);
    cache.get(chromosome, inputData, weights);
    cache.get(chromosome, inputData, weights);

    const stats = cache.getStats();
    assert.strictEqual(stats.hits, 3, "Should have 3 hits");
    assert.strictEqual(stats.misses, 1, "Should have 1 miss");
    assert.strictEqual(stats.hitRate, 0.75, "Hit rate should be 75%");
  });

  test("evaluateFitness without cache works", () => {
    const inputData = createMockInputData();
    const chromosome = createTestChromosome();
    const weights = DEFAULT_GA_CONFIG.constraintWeights;

    const result = evaluateFitness(chromosome, inputData, weights);

    assert.ok(result, "Should return fitness result");
    assert.ok(
      typeof result.totalPenalty === "number",
      "Should have totalPenalty",
    );
    assert.ok(
      typeof result.fitnessScore === "number",
      "Should have fitnessScore",
    );
    assert.ok(typeof result.isFeasible === "boolean", "Should have isFeasible");
  });

  test("evaluateFitness with cache uses cache", () => {
    const cache = new FitnessCache();
    const inputData = createMockInputData();
    const chromosome = createTestChromosome();
    const weights = DEFAULT_GA_CONFIG.constraintWeights;

    // First call
    evaluateFitness(chromosome, inputData, weights, cache);
    const stats1 = cache.getStats();
    assert.strictEqual(stats1.misses, 1, "First call should be cache miss");

    // Second call
    evaluateFitness(chromosome, inputData, weights, cache);
    const stats2 = cache.getStats();
    assert.strictEqual(stats2.hits, 1, "Second call should be cache hit");
  });

  test("evaluatePopulation returns results for all chromosomes", () => {
    const inputData = createMockInputData();
    const weights = DEFAULT_GA_CONFIG.constraintWeights;

    const population = [
      createTestChromosome(),
      createTestChromosome(),
      createTestChromosome(),
    ];

    const results = evaluatePopulation(population, inputData, weights);

    assert.strictEqual(
      results.length,
      population.length,
      "Should return result for each chromosome",
    );
    results.forEach((result) => {
      assert.ok(result, "Each result should be defined");
      assert.ok(typeof result.totalPenalty === "number");
    });
  });

  test("evaluatePopulation with cache improves performance", () => {
    const cache = new FitnessCache();
    const inputData = createMockInputData();
    const weights = DEFAULT_GA_CONFIG.constraintWeights;

    // Population with duplicate chromosomes
    const chromosome = createTestChromosome();
    const population = [chromosome, chromosome, chromosome];

    evaluatePopulation(population, inputData, weights, cache);

    const stats = cache.getStats();
    assert.strictEqual(
      stats.misses,
      1,
      "Should only evaluate unique chromosome once",
    );
    assert.strictEqual(stats.hits, 2, "Should use cache for duplicates");
  });

  test("compareFitness prefers feasible over infeasible", () => {
    const feasible = {
      totalPenalty: 100,
      fitnessScore: 0.5,
      isFeasible: true,
      hardPenalty: 0,
      softPenalty: 100,
      hardViolations: [],
      softViolations: [],
      hardViolationCount: 0,
      softViolationCount: 5,
    };

    const infeasible = {
      totalPenalty: 50,
      fitnessScore: 0.8,
      isFeasible: false,
      hardPenalty: 1000,
      softPenalty: 50,
      hardViolations: [],
      softViolations: [],
      hardViolationCount: 1,
      softViolationCount: 2,
    };

    const result = compareFitness(feasible, infeasible);
    assert.ok(result > 0, "Feasible should be better than infeasible");
  });

  test("compareFitness compares by hard violations when both infeasible", () => {
    const lessViolations = {
      totalPenalty: 1000,
      fitnessScore: 0.1,
      isFeasible: false,
      hardPenalty: 1000,
      softPenalty: 0,
      hardViolations: [],
      softViolations: [],
      hardViolationCount: 1,
      softViolationCount: 0,
    };

    const moreViolations = {
      totalPenalty: 5000,
      fitnessScore: 0.01,
      isFeasible: false,
      hardPenalty: 5000,
      softPenalty: 0,
      hardViolations: [],
      softViolations: [],
      hardViolationCount: 5,
      softViolationCount: 0,
    };

    const result = compareFitness(lessViolations, moreViolations);
    assert.ok(result > 0, "Fewer violations should be better");
  });

  test("compareFitness compares by total penalty when both feasible", () => {
    const lowerPenalty = {
      totalPenalty: 100,
      fitnessScore: 0.8,
      isFeasible: true,
      hardPenalty: 0,
      softPenalty: 100,
      hardViolations: [],
      softViolations: [],
      hardViolationCount: 0,
      softViolationCount: 5,
    };

    const higherPenalty = {
      totalPenalty: 500,
      fitnessScore: 0.5,
      isFeasible: true,
      hardPenalty: 0,
      softPenalty: 500,
      hardViolations: [],
      softViolations: [],
      hardViolationCount: 0,
      softViolationCount: 10,
    };

    const result = compareFitness(lowerPenalty, higherPenalty);
    assert.ok(result > 0, "Lower penalty should be better");
  });

  test("compareFitness returns equal for identical fitness", () => {
    const fitness = {
      totalPenalty: 100,
      fitnessScore: 0.5,
      isFeasible: true,
      hardPenalty: 0,
      softPenalty: 100,
      hardViolations: [],
      softViolations: [],
      hardViolationCount: 0,
      softViolationCount: 5,
    };

    const result = compareFitness(fitness, fitness);
    assert.strictEqual(result, 0, "Identical fitness should be equal");
  });
});
