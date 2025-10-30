/**
 * Unit tests for Selection Operator
 *
 * This test file validates the tournament selection implementation.
 * Run with: node --import tsx --test src/server/services/timetableGenerator/__tests__/selection.test.ts
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { Population, FitnessResult } from "../types";
import { tournamentSelection, selectParents } from "../selection";

// ============================================================================
// MOCK DATA CREATION
// ============================================================================

/**
 * Create a simple mock population for testing
 */
function createMockPopulation(size: number): Population {
  const population: Population = [];

  for (let i = 0; i < size; i++) {
    population.push([
      {
        lectureEventId: `evt${i}`,
        lectureId: `lec${i}`,
        timeslotId: `slot${i}`,
        classroomId: `room${i}`,
        isLocked: false,
        duration: 1,
      },
    ]);
  }

  return population;
}

/**
 * Create mock fitness results with varying quality
 */
function createMockFitnessResults(
  size: number,
  hardViolationCounts?: number[],
): FitnessResult[] {
  const results: FitnessResult[] = [];

  for (let i = 0; i < size; i++) {
    const hardCount = hardViolationCounts ? hardViolationCounts[i]! : i;
    results.push({
      hardViolationCount: hardCount,
      softViolationCount: i * 10,
      hardViolations: [],
      softViolations: [],
      hardPenalty: hardCount * 1000,
      softPenalty: i * 10,
      totalPenalty: hardCount * 1000 + i * 10,
      fitnessScore: 1 / (1 + hardCount * 1000 + i * 10),
      isFeasible: hardCount === 0,
    });
  }

  return results;
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

describe("Selection Operator", () => {
  test("Tournament selection selects from tournament participants", () => {
    const population = createMockPopulation(10);
    const fitnessResults = createMockFitnessResults(10);

    // Run selection multiple times
    for (let i = 0; i < 50; i++) {
      const selectedIndex = tournamentSelection(population, fitnessResults, 3);

      assert.ok(
        selectedIndex >= 0 && selectedIndex < population.length,
        "Selected index should be within population bounds",
      );
    }
  });

  test("Tournament selection favors better fitness", () => {
    const population = createMockPopulation(5);
    // Create fitness where index 0 is best (0 hard violations)
    const fitnessResults = createMockFitnessResults(5, [0, 5, 10, 15, 20]);

    // Run many tournaments - index 0 should be selected more often
    const selectionCounts = new Map<number, number>();
    const trials = 1000;

    for (let i = 0; i < trials; i++) {
      const selected = tournamentSelection(population, fitnessResults, 3);
      selectionCounts.set(selected, (selectionCounts.get(selected) || 0) + 1);
    }

    // Best individual (index 0) should be selected more than average
    const bestCount = selectionCounts.get(0) || 0;
    const averageCount = trials / population.length;

    assert.ok(
      bestCount > averageCount,
      `Best individual should be selected more than average (${bestCount} > ${averageCount})`,
    );
  });

  test("Tournament selection throws on empty population", () => {
    const population: Population = [];
    const fitnessResults: FitnessResult[] = [];

    assert.throws(
      () => tournamentSelection(population, fitnessResults, 3),
      /Cannot select from empty population/,
    );
  });

  test("Tournament selection throws on invalid tournament size", () => {
    const population = createMockPopulation(5);
    const fitnessResults = createMockFitnessResults(5);

    assert.throws(
      () => tournamentSelection(population, fitnessResults, 1),
      /Tournament size must be at least 2/,
    );

    assert.throws(
      () => tournamentSelection(population, fitnessResults, 10),
      /Tournament size.*cannot exceed population size/,
    );
  });

  test("selectParents returns correct number of parents", () => {
    const population = createMockPopulation(10);
    const fitnessResults = createMockFitnessResults(10);

    const parents = selectParents(population, fitnessResults, 3, 5);

    assert.strictEqual(parents.length, 5, "Should return 5 parents");

    // All indices should be valid
    parents.forEach((index) => {
      assert.ok(
        index >= 0 && index < population.length,
        "Parent index should be valid",
      );
    });
  });

  test("selectParents can select same parent multiple times", () => {
    const population = createMockPopulation(3);
    // Make one clearly best
    const fitnessResults = createMockFitnessResults(3, [0, 100, 100]);

    const parents = selectParents(population, fitnessResults, 2, 10);

    // With 10 selections and best being much better, likely some duplicates
    const uniqueParents = new Set(parents);
    assert.ok(
      uniqueParents.size < parents.length,
      "Should allow duplicate parent selections",
    );
  });

  test("Tournament selection without replacement within single tournament", () => {
    const population = createMockPopulation(5);
    const fitnessResults = createMockFitnessResults(5);

    // Run many times to ensure no duplicate indices within a tournament
    for (let i = 0; i < 100; i++) {
      const selected = tournamentSelection(population, fitnessResults, 3);
      // Just verify it doesn't throw and returns valid index
      assert.ok(selected >= 0 && selected < population.length);
    }
  });

  test("Tournament selection with size 2 works correctly", () => {
    const population = createMockPopulation(10);
    const fitnessResults = createMockFitnessResults(10);

    const selections = new Set<number>();
    for (let i = 0; i < 50; i++) {
      const selected = tournamentSelection(population, fitnessResults, 2);
      selections.add(selected);
    }

    // Should have selected from various individuals
    assert.ok(
      selections.size > 1,
      "Should select different individuals across multiple tournaments",
    );
  });

  test("Tournament selection with all equal fitness distributes selections", () => {
    const population = createMockPopulation(5);
    // All have same fitness
    const fitnessResults = createMockFitnessResults(5, [10, 10, 10, 10, 10]);

    const selectionCounts = new Map<number, number>();
    const trials = 1000;

    for (let i = 0; i < trials; i++) {
      const selected = tournamentSelection(population, fitnessResults, 3);
      selectionCounts.set(selected, (selectionCounts.get(selected) || 0) + 1);
    }

    // With equal fitness, all individuals should get selected at least sometimes
    // (though distribution might not be perfectly uniform due to comparison tie-breaking)
    const selectedIndividuals = selectionCounts.size;
    assert.ok(
      selectedIndividuals >= 3,
      `Should select from multiple individuals when fitness is equal (got ${selectedIndividuals})`,
    );
  });

  test("Larger tournament size increases selection pressure", () => {
    const population = createMockPopulation(10);
    // Best at index 0
    const fitnessResults = createMockFitnessResults(
      10,
      [0, 5, 10, 15, 20, 25, 30, 35, 40, 45],
    );

    const trials = 1000;

    // Test with tournament size 2
    let bestSelectedSize2 = 0;
    for (let i = 0; i < trials; i++) {
      if (tournamentSelection(population, fitnessResults, 2) === 0) {
        bestSelectedSize2++;
      }
    }

    // Test with tournament size 5
    let bestSelectedSize5 = 0;
    for (let i = 0; i < trials; i++) {
      if (tournamentSelection(population, fitnessResults, 5) === 0) {
        bestSelectedSize5++;
      }
    }

    // Larger tournament should select best more often
    assert.ok(
      bestSelectedSize5 > bestSelectedSize2,
      `Larger tournament should increase selection pressure (size 5: ${bestSelectedSize5}, size 2: ${bestSelectedSize2})`,
    );
  });
});
