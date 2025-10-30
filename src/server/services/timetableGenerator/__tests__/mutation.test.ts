/**
 * Unit tests for Mutation Operator
 *
 * This test file validates the mutation operator implementation,
 * including swap mutation, random reset mutation, and probability control.
 * Run with: node --import tsx --test src/server/services/timetableGenerator/__tests__/mutation.test.ts
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { Chromosome, GAInputData, GAConfig } from "../types";
import { DEFAULT_GA_CONFIG } from "../config";
import { swapMutation, randomResetMutation, mutate } from "../mutation";

// ============================================================================
// MOCK DATA CREATION
// ============================================================================

/**
 * Create minimal mock GAInputData for testing
 */
function createMockInputData(): GAInputData {
  return {
    timetableId: "test-timetable",
    lectures: [],
    teachers: [],
    subdivisions: [],
    classrooms: [
      {
        id: "room1",
        name: "Room 1",
        timetableId: "test-timetable",
        unavailableSlots: [],
      },
      {
        id: "room2",
        name: "Room 2",
        timetableId: "test-timetable",
        unavailableSlots: [],
      },
    ],
    slots: [
      {
        id: "slot1",
        timetableId: "test-timetable",
        day: 1,
        number: 1,
        createdAt: new Date(),
      },
      {
        id: "slot2",
        timetableId: "test-timetable",
        day: 1,
        number: 2,
        createdAt: new Date(),
      },
      {
        id: "slot3",
        timetableId: "test-timetable",
        day: 2,
        number: 1,
        createdAt: new Date(),
      },
    ],
    totalEvents: 2,
    eventIds: ["lec1-evt0", "lec1-evt1"],
    lookupMaps: {
      teacherToLectures: new Map(),
      subdivisionToLectures: new Map(),
      lectureToSubdivisions: new Map(),
      lectureToAllowedClassrooms: new Map([["lec1", ["room1", "room2"]]]),
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
 * Create a simple test chromosome
 */
function createTestChromosome(): Chromosome {
  return [
    {
      lectureEventId: "lec1-evt0",
      lectureId: "lec1",
      timeslotId: "slot1",
      classroomId: "room1",
      isLocked: false,
      duration: 1,
    },
    {
      lectureEventId: "lec1-evt1",
      lectureId: "lec1",
      timeslotId: "slot2",
      classroomId: "room2",
      isLocked: false,
      duration: 1,
    },
  ];
}

/**
 * Create a chromosome with locked genes
 */
function createLockedChromosome(): Chromosome {
  return [
    {
      lectureEventId: "lec1-evt0",
      lectureId: "lec1",
      timeslotId: "slot1",
      classroomId: "room1",
      isLocked: true, // Locked gene
      duration: 1,
    },
    {
      lectureEventId: "lec1-evt1",
      lectureId: "lec1",
      timeslotId: "slot2",
      classroomId: "room2",
      isLocked: false,
      duration: 1,
    },
  ];
}

describe("Mutation Operator", () => {
  test("Swap Mutation - Verify genes are swapped", () => {
    const inputData = createMockInputData();
    const chromosome = createTestChromosome();

    const originalGene0 = { ...chromosome[0]! };
    const originalGene1 = { ...chromosome[1]! };

    // Run swap mutation multiple times to ensure it eventually swaps
    let mutationOccurred = false;
    for (let i = 0; i < 100; i++) {
      const mutated = swapMutation(chromosome, inputData);

      // Check if swap occurred (timeslots or classrooms changed)
      if (
        mutated[0]!.timeslotId !== originalGene0.timeslotId ||
        mutated[0]!.classroomId !== originalGene0.classroomId
      ) {
        mutationOccurred = true;

        // Verify swap: gene0 should have gene1's assignments and vice versa
        assert.strictEqual(
          mutated[0]!.timeslotId,
          originalGene1.timeslotId,
          "Gene 0 should have gene 1's timeslot after swap",
        );
        assert.strictEqual(
          mutated[0]!.classroomId,
          originalGene1.classroomId,
          "Gene 0 should have gene 1's classroom after swap",
        );
        assert.strictEqual(
          mutated[1]!.timeslotId,
          originalGene0.timeslotId,
          "Gene 1 should have gene 0's timeslot after swap",
        );
        assert.strictEqual(
          mutated[1]!.classroomId,
          originalGene0.classroomId,
          "Gene 1 should have gene 0's classroom after swap",
        );

        // Verify gene metadata unchanged
        assert.strictEqual(
          mutated[0]!.lectureEventId,
          originalGene0.lectureEventId,
          "Gene 0 event ID should not change",
        );
        assert.strictEqual(
          mutated[0]!.lectureId,
          originalGene0.lectureId,
          "Gene 0 lecture ID should not change",
        );

        break;
      }
    }

    assert.ok(
      mutationOccurred,
      "Swap mutation should occur within 100 attempts",
    );
  });

  test("Random Reset Mutation - Verify one gene is randomly reassigned", () => {
    const inputData = createMockInputData();
    const chromosome = createTestChromosome();

    const originalGene0 = { ...chromosome[0]! };
    const originalGene1 = { ...chromosome[1]! };

    // Run random reset multiple times to ensure it works
    let mutationOccurred = false;
    for (let i = 0; i < 100; i++) {
      const mutated = randomResetMutation(chromosome, inputData);

      // Check if any gene changed
      const gene0Changed =
        mutated[0]!.timeslotId !== originalGene0.timeslotId ||
        mutated[0]!.classroomId !== originalGene0.classroomId;
      const gene1Changed =
        mutated[1]!.timeslotId !== originalGene1.timeslotId ||
        mutated[1]!.classroomId !== originalGene1.classroomId;

      if (gene0Changed || gene1Changed) {
        mutationOccurred = true;

        // Verify new assignments are valid
        if (gene0Changed) {
          assert.ok(
            inputData.slots.some((s) => s.id === mutated[0]!.timeslotId),
            "New timeslot should be valid",
          );
          assert.ok(
            ["room1", "room2"].includes(mutated[0]!.classroomId),
            "New classroom should be from allowed list",
          );
        }

        break;
      }
    }

    assert.ok(
      mutationOccurred,
      "Random reset mutation should occur within 100 attempts",
    );
  });

  test("Locked Gene Preservation - Verify locked genes never change", () => {
    const inputData = createMockInputData();
    const chromosome = createLockedChromosome();

    const originalLockedGene = { ...chromosome[0]! };

    // Run both mutation types multiple times
    for (let i = 0; i < 50; i++) {
      const swapMutated = swapMutation(chromosome, inputData);
      const resetMutated = randomResetMutation(chromosome, inputData);

      // Verify locked gene never changed
      assert.strictEqual(
        swapMutated[0]!.timeslotId,
        originalLockedGene.timeslotId,
        "Locked gene timeslot should not change in swap mutation",
      );
      assert.strictEqual(
        swapMutated[0]!.classroomId,
        originalLockedGene.classroomId,
        "Locked gene classroom should not change in swap mutation",
      );

      assert.strictEqual(
        resetMutated[0]!.timeslotId,
        originalLockedGene.timeslotId,
        "Locked gene timeslot should not change in random reset",
      );
      assert.strictEqual(
        resetMutated[0]!.classroomId,
        originalLockedGene.classroomId,
        "Locked gene classroom should not change in random reset",
      );
    }
  });

  test("Mutation Probability Control - Verify probability works", () => {
    const inputData = createMockInputData();
    const chromosome = createTestChromosome();

    // Test with probability = 0 (no mutation)
    const configNoMutation: GAConfig = {
      ...DEFAULT_GA_CONFIG,
      mutationProbability: 0,
    };

    let mutationOccurred = false;
    for (let i = 0; i < 50; i++) {
      const mutated = mutate(chromosome, inputData, configNoMutation);

      // Check if any gene changed
      if (
        mutated[0]!.timeslotId !== chromosome[0]!.timeslotId ||
        mutated[0]!.classroomId !== chromosome[0]!.classroomId ||
        mutated[1]!.timeslotId !== chromosome[1]!.timeslotId ||
        mutated[1]!.classroomId !== chromosome[1]!.classroomId
      ) {
        mutationOccurred = true;
        break;
      }
    }

    assert.strictEqual(
      mutationOccurred,
      false,
      "No mutation should occur when probability is 0",
    );

    // Test with probability = 1 (always mutate)
    const configAlwaysMutate: GAConfig = {
      ...DEFAULT_GA_CONFIG,
      mutationProbability: 1.0,
    };

    mutationOccurred = false;
    for (let i = 0; i < 10; i++) {
      const mutated = mutate(chromosome, inputData, configAlwaysMutate);

      // Check if any gene changed
      if (
        mutated[0]!.timeslotId !== chromosome[0]!.timeslotId ||
        mutated[0]!.classroomId !== chromosome[0]!.classroomId ||
        mutated[1]!.timeslotId !== chromosome[1]!.timeslotId ||
        mutated[1]!.classroomId !== chromosome[1]!.classroomId
      ) {
        mutationOccurred = true;
        break;
      }
    }

    assert.ok(
      mutationOccurred,
      "Mutation should occur when probability is 1.0",
    );
  });

  test("No Parent Modification - Verify original chromosome unchanged", () => {
    const inputData = createMockInputData();
    const chromosome = createTestChromosome();

    const originalGene0 = { ...chromosome[0]! };
    const originalGene1 = { ...chromosome[1]! };

    const config: GAConfig = {
      ...DEFAULT_GA_CONFIG,
      mutationProbability: 1.0, // Always mutate
    };

    // Run mutation - we just want to verify it doesn't throw
    mutate(chromosome, inputData, config);

    // Verify original chromosome unchanged
    assert.strictEqual(
      chromosome[0]!.timeslotId,
      originalGene0.timeslotId,
      "Original chromosome gene 0 timeslot should not change",
    );
    assert.strictEqual(
      chromosome[0]!.classroomId,
      originalGene0.classroomId,
      "Original chromosome gene 0 classroom should not change",
    );
    assert.strictEqual(
      chromosome[1]!.timeslotId,
      originalGene1.timeslotId,
      "Original chromosome gene 1 timeslot should not change",
    );
    assert.strictEqual(
      chromosome[1]!.classroomId,
      originalGene1.classroomId,
      "Original chromosome gene 1 classroom should not change",
    );
  });

  test("Strategy Selection - Verify swap vs reset ratio", () => {
    const inputData = createMockInputData();
    const chromosome = createTestChromosome();

    const config: GAConfig = {
      ...DEFAULT_GA_CONFIG,
      mutationProbability: 1.0, // Always mutate
      swapMutationRatio: 0.9, // 90% swap, 10% reset
    };

    // Track mutation types (heuristic: if both genes change it was likely swap)
    let swapCount = 0;
    let resetCount = 0;
    const trials = 1000;

    for (let i = 0; i < trials; i++) {
      const mutated = mutate(chromosome, inputData, config);

      const gene0Changed =
        mutated[0]!.timeslotId !== chromosome[0]!.timeslotId ||
        mutated[0]!.classroomId !== chromosome[0]!.classroomId;
      const gene1Changed =
        mutated[1]!.timeslotId !== chromosome[1]!.timeslotId ||
        mutated[1]!.classroomId !== chromosome[1]!.classroomId;

      // Heuristic: if both changed, likely swap; if one changed, likely reset
      if (gene0Changed && gene1Changed) {
        swapCount++;
      } else if (gene0Changed || gene1Changed) {
        resetCount++;
      }
    }

    const swapRatio = swapCount / (swapCount + resetCount);

    // Allow 10% tolerance
    assert.ok(
      swapRatio >= 0.8 && swapRatio <= 1.0,
      `Swap ratio should be approximately 0.9, got ${swapRatio.toFixed(2)}`,
    );
  });
});
