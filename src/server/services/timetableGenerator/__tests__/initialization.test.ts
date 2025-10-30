/**
 * Unit tests for Population Initialization
 *
 * This test file validates chromosome and population initialization strategies.
 * Run with: node --import tsx --test src/server/services/timetableGenerator/__tests__/initialization.test.ts
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { GAInputData, GALecture, GAConfig } from "../types";
import { DEFAULT_GA_CONFIG } from "../config";
import {
  initializeRandomChromosome,
  initializeHeuristicChromosome,
  initializePopulation,
} from "../initialization";

// ============================================================================
// MOCK DATA CREATION
// ============================================================================

/**
 * Create mock input data for testing
 */
function createMockInputData(): GAInputData {
  const mockLecture1: GALecture = {
    id: "lec1",
    teacherId: "teacher1",
    subjectId: "subject1",
    timetableId: "test-tt",
    count: 2,
    duration: 1,
    createdAt: new Date(),
    subdivisions: [],
    allowedClassrooms: [],
    lockedSlots: [],
    subject: {
      id: "subject1",
      name: "Math",
      groupId: "group1",
      group: {
        id: "group1",
        name: "Group A",
        timetableId: "test-tt",
        allowSimultaneous: false,
      },
    },
    teacher: {} as any,
  };

  const mockLecture2: GALecture = {
    id: "lec2",
    teacherId: "teacher2",
    subjectId: "subject2",
    timetableId: "test-tt",
    count: 1,
    duration: 1,
    createdAt: new Date(),
    subdivisions: [],
    allowedClassrooms: [],
    lockedSlots: [],
    subject: {
      id: "subject2",
      name: "Physics",
      groupId: "group1",
      group: {
        id: "group1",
        name: "Group A",
        timetableId: "test-tt",
        allowSimultaneous: false,
      },
    },
    teacher: {} as any,
  };

  return {
    timetableId: "test-tt",
    lectures: [mockLecture1, mockLecture2],
    teachers: [
      {
        id: "teacher1",
        name: "Dr. Smith",
        email: "smith@test.com",
        timetableId: "test-tt",
        dailyMaxHours: 4,
        weeklyMaxHours: 16,
        unavailableSlots: [],
      },
      {
        id: "teacher2",
        name: "Dr. Jones",
        email: "jones@test.com",
        timetableId: "test-tt",
        dailyMaxHours: 4,
        weeklyMaxHours: 16,
        unavailableSlots: [],
      },
    ],
    subdivisions: [],
    classrooms: [
      {
        id: "room1",
        name: "Room 1",
        timetableId: "test-tt",
        unavailableSlots: [],
      },
      {
        id: "room2",
        name: "Room 2",
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
      {
        id: "slot3",
        day: 1,
        number: 1,
        timetableId: "test-tt",
        createdAt: new Date(),
      },
    ],
    eventIds: ["lec1-evt0", "lec1-evt1", "lec2-evt0"],
    totalEvents: 3,
    lookupMaps: {
      teacherToLectures: new Map([
        ["teacher1", ["lec1-evt0", "lec1-evt1"]],
        ["teacher2", ["lec2-evt0"]],
      ]),
      subdivisionToLectures: new Map(),
      lectureToSubdivisions: new Map(),
      lectureToAllowedClassrooms: new Map([
        ["lec1", ["room1", "room2"]],
        ["lec2", ["room1", "room2"]],
      ]),
      eventToLecture: new Map([
        ["lec1-evt0", mockLecture1],
        ["lec1-evt1", mockLecture1],
        ["lec2-evt0", mockLecture2],
      ]),
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
 * Create input data with locked assignments
 */
function createMockInputDataWithLocks(): GAInputData {
  const inputData = createMockInputData();

  // Add a locked assignment for evt1
  inputData.lookupMaps.lockedAssignments.set("lec1-evt0", {
    slotId: "slot1",
    classroomId: "room1",
  });

  return inputData;
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

describe("Population Initialization", () => {
  test("initializeRandomChromosome creates valid chromosome", () => {
    const inputData = createMockInputData();
    const chromosome = initializeRandomChromosome(inputData);

    assert.strictEqual(
      chromosome.length,
      inputData.totalEvents,
      "Chromosome should have correct length",
    );

    chromosome.forEach((gene, index) => {
      assert.ok(gene.lectureEventId, "Gene should have lectureEventId");
      assert.ok(gene.lectureId, "Gene should have lectureId");
      assert.ok(gene.timeslotId, "Gene should have timeslotId");
      assert.ok(gene.classroomId, "Gene should have classroomId");
      assert.ok(
        typeof gene.isLocked === "boolean",
        "Gene should have isLocked",
      );
      assert.ok(typeof gene.duration === "number", "Gene should have duration");

      // Verify slot is valid
      const validSlot = inputData.slots.some((s) => s.id === gene.timeslotId);
      assert.ok(validSlot, `Gene ${index} should have valid slot`);

      // Verify classroom is valid
      const validClassroom = inputData.classrooms.some(
        (c) => c.id === gene.classroomId,
      );
      assert.ok(validClassroom, `Gene ${index} should have valid classroom`);
    });
  });

  test("initializeRandomChromosome respects locked assignments", () => {
    const inputData = createMockInputDataWithLocks();
    const chromosome = initializeRandomChromosome(inputData);

    const lockedGene = chromosome.find((g) => g.lectureEventId === "lec1-evt0");
    assert.ok(lockedGene, "Should have gene for locked event");
    assert.strictEqual(
      lockedGene.timeslotId,
      "slot1",
      "Locked gene should use locked slot",
    );
    assert.strictEqual(
      lockedGene.classroomId,
      "room1",
      "Locked gene should use locked classroom",
    );
    assert.strictEqual(
      lockedGene.isLocked,
      true,
      "Gene should be marked as locked",
    );
  });

  test("initializeRandomChromosome generates different solutions", () => {
    const inputData = createMockInputData();

    const chromosome1 = initializeRandomChromosome(inputData);
    const chromosome2 = initializeRandomChromosome(inputData);

    // With randomness, these should be different (with high probability)
    let differences = 0;
    for (let i = 0; i < chromosome1.length; i++) {
      if (
        chromosome1[i]!.timeslotId !== chromosome2[i]!.timeslotId ||
        chromosome1[i]!.classroomId !== chromosome2[i]!.classroomId
      ) {
        differences++;
      }
    }

    assert.ok(
      differences > 0,
      "Random initialization should produce different solutions",
    );
  });

  test("initializeHeuristicChromosome creates valid chromosome", () => {
    const inputData = createMockInputData();
    const chromosome = initializeHeuristicChromosome(inputData);

    assert.strictEqual(
      chromosome.length,
      inputData.totalEvents,
      "Chromosome should have correct length",
    );

    chromosome.forEach((gene, index) => {
      assert.ok(gene.lectureEventId, "Gene should have lectureEventId");
      assert.ok(gene.timeslotId, "Gene should have timeslotId");
      assert.ok(gene.classroomId, "Gene should have classroomId");

      // Verify assignments are valid
      const validSlot = inputData.slots.some((s) => s.id === gene.timeslotId);
      assert.ok(validSlot, `Gene ${index} should have valid slot`);

      const validClassroom = inputData.classrooms.some(
        (c) => c.id === gene.classroomId,
      );
      assert.ok(validClassroom, `Gene ${index} should have valid classroom`);
    });
  });

  test("initializeHeuristicChromosome attempts to minimize conflicts", () => {
    const inputData = createMockInputData();

    // Generate multiple heuristic chromosomes
    const chromosomes = Array.from({ length: 10 }, () =>
      initializeHeuristicChromosome(inputData),
    );

    // Heuristic should produce valid chromosomes
    chromosomes.forEach((chromosome) => {
      assert.strictEqual(chromosome.length, inputData.totalEvents);
    });
  });

  test("initializePopulation creates correct number of chromosomes", () => {
    const inputData = createMockInputData();
    const config: GAConfig = {
      ...DEFAULT_GA_CONFIG,
      populationSize: 10,
      heuristicInitRatio: 0.5,
    };

    const population = initializePopulation(config, inputData);

    assert.strictEqual(
      population.length,
      10,
      "Population should have correct size",
    );

    population.forEach((chromosome, index) => {
      assert.strictEqual(
        chromosome.length,
        inputData.totalEvents,
        `Chromosome ${index} should have correct length`,
      );
    });
  });

  test("initializePopulation uses correct ratio of heuristic vs random", () => {
    const inputData = createMockInputData();
    const config: GAConfig = {
      ...DEFAULT_GA_CONFIG,
      populationSize: 20,
      heuristicInitRatio: 0.3, // 30% heuristic, 70% random
    };

    const population = initializePopulation(config, inputData);

    assert.strictEqual(population.length, 20, "Should create 20 chromosomes");
    // We can't directly verify the ratio after shuffling,
    // but we can verify the population is complete
  });

  test("initializePopulation with 100% heuristic ratio", () => {
    const inputData = createMockInputData();
    const config: GAConfig = {
      ...DEFAULT_GA_CONFIG,
      populationSize: 5,
      heuristicInitRatio: 1.0, // 100% heuristic
    };

    const population = initializePopulation(config, inputData);

    assert.strictEqual(population.length, 5, "Should create 5 chromosomes");
  });

  test("initializePopulation with 0% heuristic ratio", () => {
    const inputData = createMockInputData();
    const config: GAConfig = {
      ...DEFAULT_GA_CONFIG,
      populationSize: 5,
      heuristicInitRatio: 0.0, // 100% random
    };

    const population = initializePopulation(config, inputData);

    assert.strictEqual(population.length, 5, "Should create 5 chromosomes");
  });

  test("initializePopulation shuffles chromosomes", () => {
    const inputData = createMockInputData();
    const config: GAConfig = {
      ...DEFAULT_GA_CONFIG,
      populationSize: 20,
      heuristicInitRatio: 0.5,
    };

    // Generate multiple populations and verify they're different
    const pop1 = initializePopulation(config, inputData);
    const pop2 = initializePopulation(config, inputData);

    // Populations should be different due to shuffling and randomness
    let differences = 0;
    for (let i = 0; i < pop1.length; i++) {
      const chr1 = pop1[i]!;
      const chr2 = pop2[i]!;

      for (let j = 0; j < chr1.length; j++) {
        if (
          chr1[j]!.timeslotId !== chr2[j]!.timeslotId ||
          chr1[j]!.classroomId !== chr2[j]!.classroomId
        ) {
          differences++;
        }
      }
    }

    assert.ok(
      differences > 0,
      "Different population initializations should produce different results",
    );
  });

  test("Chromosomes maintain correct event order", () => {
    const inputData = createMockInputData();
    const chromosome = initializeRandomChromosome(inputData);

    // Verify event IDs are in correct order
    chromosome.forEach((gene, index) => {
      assert.strictEqual(
        gene.lectureEventId,
        inputData.eventIds[index],
        "Gene should have correct event ID at correct position",
      );
    });
  });

  test("Locked assignments are never randomized", () => {
    const inputData = createMockInputDataWithLocks();

    // Generate multiple random chromosomes
    for (let i = 0; i < 10; i++) {
      const chromosome = initializeRandomChromosome(inputData);
      const lockedGene = chromosome.find(
        (g) => g.lectureEventId === "lec1-evt0",
      );

      assert.ok(lockedGene, "Should have locked gene");
      assert.strictEqual(
        lockedGene.timeslotId,
        "slot1",
        "Locked slot should never change",
      );
      assert.strictEqual(
        lockedGene.classroomId,
        "room1",
        "Locked classroom should never change",
      );
    }
  });
});
