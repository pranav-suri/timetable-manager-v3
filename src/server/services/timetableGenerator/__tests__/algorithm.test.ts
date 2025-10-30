/**
 * @file algorithm.test.ts
 * @description Integration test for the main GA loop.
 *
 * This file tests the `runGA` function to ensure that all the components of
 * the genetic algorithm work together correctly.
 */

import { describe, it, assert, vi } from "vitest";
import type {
  GAInputData,
  GAConfig,
  GALecture,
  GAClassroom,
  GASlot,
  GATeacher,
  LookupMaps,
} from "../types";
import { runGA } from "../algorithm";

// Mock a simplified version of the GA input data
const createMockInputData = (): GAInputData => {
  const lectures: GALecture[] = [
    {
      id: "lec1",
      subjectId: "sub1",
      teacherId: "t1",
      duration: 1,
      count: 1,
      subdivisions: [],
      allowedClassrooms: [],
      lockedSlots: [],
      timetableId: "test-tt",
      createdAt: new Date(),
      subject: {
        id: "sub1",
        name: "Subject 1",
        groupId: "g1",
        group: {
          id: "g1",
          name: "Group 1",
          timetableId: "test-tt",
          allowSimultaneous: false,
        },
      },
      teacher: {} as GATeacher,
    } as GALecture,
    {
      id: "lec2",
      subjectId: "sub2",
      teacherId: "t1",
      duration: 1,
      count: 1,
      subdivisions: [],
      allowedClassrooms: [],
      lockedSlots: [],
      timetableId: "test-tt",
      createdAt: new Date(),
      subject: {
        id: "sub2",
        name: "Subject 2",
        groupId: "g1",
        group: {
          id: "g1",
          name: "Group 1",
          timetableId: "test-tt",
          allowSimultaneous: false,
        },
      },
      teacher: {} as GATeacher,
    } as GALecture,
  ];

  const slots: GASlot[] = [
    {
      id: "slot1",
      day: 1,
      number: 1,
      timetableId: "test-tt",
      createdAt: new Date(),
    },
    {
      id: "slot2",
      day: 1,
      number: 2,
      timetableId: "test-tt",
      createdAt: new Date(),
    },
  ];

  const classrooms: GAClassroom[] = [
    {
      id: "room1",
      name: "Room 1",
      timetableId: "test-tt",
      unavailableSlots: [],
    } as GAClassroom,
    {
      id: "room2",
      name: "Room 2",
      timetableId: "test-tt",
      unavailableSlots: [],
    } as GAClassroom,
  ];

  const eventIds = ["lec1-evt0", "lec2-evt0"];

  const lookupMaps: LookupMaps = {
    teacherToLectures: new Map([["t1", ["lec1-evt0", "lec2-evt0"]]]),
    subdivisionToLectures: new Map(),
    lectureToSubdivisions: new Map(),
    lectureToAllowedClassrooms: new Map(),
    eventToLecture: new Map([
      ["lec1-evt0", lectures[0]!],
      ["lec2-evt0", lectures[1]!],
    ]),
    eventToSubdivisions: new Map(),
    teacherUnavailable: new Map(),
    subdivisionUnavailable: new Map(),
    classroomUnavailable: new Map(),
    slotIdToSlot: new Map(slots.map((s) => [s.id, s])),
    slotLinearization: new Map(),
    linearToSlotId: new Map(),
    classroomIdToClassroom: new Map(classrooms.map((c) => [c.id, c])),
    classroomCapacity: new Map([
      ["room1", 30],
      ["room2", 30],
    ]),
    lockedAssignments: new Map(),
  };

  return {
    timetableId: "test-tt",
    lectures,
    teachers: [],
    subdivisions: [],
    classrooms,
    slots,
    totalEvents: 2,
    eventIds,
    lookupMaps,
  };
};

describe("Main GA Algorithm", () => {
  it("should run through the evolutionary loop and return a result", async () => {
    const inputData = createMockInputData();
    const config: GAConfig = {
      populationSize: 10,
      maxGenerations: 5,
      crossoverProbability: 0.9,
      mutationProbability: 0.1,
      eliteCount: 2,
      tournamentSize: 2,
      maxStagnantGenerations: 10,
      heuristicInitRatio: 0.2,
      swapMutationRatio: 0.9,
      targetFitness: 1,
      maxExecutionTimeMs: 10000,
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

    const onProgress = vi.fn();

    const result = await runGA(inputData, config, onProgress);

    // 1. Check result structure
    assert.isOk(result, "Result should not be null");
    assert.isOk(result.bestChromosome, "Should return a best chromosome");
    assert.strictEqual(
      result.bestChromosome.length,
      inputData.totalEvents,
      "Best chromosome should have the correct length",
    );
    assert.isOk(result.bestFitness, "Should return fitness information");
    assert.isArray(result.stats, "Should return generation statistics");
    assert.isAbove(result.totalTime, -1, "Total time should be a number");

    // 2. Check if the loop ran
    assert.isAtMost(
      result.stats.length,
      config.maxGenerations,
      "Should run for at most maxGenerations",
    );
    assert.strictEqual(onProgress.mock.calls.length, result.stats.length);

    // 3. Check if fitness improved or stayed the same (due to elitism)
    const initialFitness = result.stats[0]?.bestFitness ?? 0;
    const finalFitness = result.bestFitness.fitnessScore;
    assert.isAtLeast(
      finalFitness,
      initialFitness,
      "Final fitness should be >= initial fitness",
    );
  });

  it("should respect the stagnation limit", async () => {
    const inputData = createMockInputData();
    const config: GAConfig = {
      populationSize: 10,
      maxGenerations: 20,
      crossoverProbability: 0,
      mutationProbability: 0, // No change in population
      eliteCount: 10, // Entire population is elite
      tournamentSize: 2,
      maxStagnantGenerations: 5,
      heuristicInitRatio: 0.2,
      swapMutationRatio: 0.9,
      targetFitness: 1,
      maxExecutionTimeMs: 10000,
      enableRepair: true,
      enableMemetic: false,
      enableParallel: false,
      constraintWeights: {
        hardConstraintWeight: 1000,
        idleTime: 1,
        dailyDistribution: 1,
        consecutivePreference: 1,
        teacherDailyLimit: 1,
        teacherWeeklyLimit: 1,
        cognitiveLoad: 1,
      },
      stopOnFeasible: false,
    };

    const result = await runGA(inputData, config);

    // Since there's no mutation or crossover, the population will stagnate immediately.
    // The loop should run for `stagnationLimit` + 1 generations.
    assert.strictEqual(result.stats.length, config.maxStagnantGenerations);
    assert.strictEqual(
      result.stats.at(-1)?.stagnation,
      config.maxStagnantGenerations,
    );
  });

  it("should stop when a feasible solution is found if config is set", async () => {
    const inputData = createMockInputData();
    const config: GAConfig = {
      populationSize: 10,
      maxGenerations: 20,
      crossoverProbability: 0.9,
      mutationProbability: 0.5,
      eliteCount: 2,
      tournamentSize: 3,
      maxStagnantGenerations: 20,
      heuristicInitRatio: 0.2,
      swapMutationRatio: 0.9,
      targetFitness: 1,
      maxExecutionTimeMs: 10000,
      enableRepair: true,
      enableMemetic: false,
      enableParallel: false,
      constraintWeights: {
        hardConstraintWeight: 1000,
        idleTime: 1,
        dailyDistribution: 1,
        consecutivePreference: 1,
        teacherDailyLimit: 1,
        teacherWeeklyLimit: 1,
        cognitiveLoad: 1,
      },
      stopOnFeasible: true, // Stop when feasible
    };

    // Mock the evaluation to return a feasible solution early
    // This is tricky without heavy mocking of all sub-modules.
    // Instead, we'll run it and check if it terminated early if a feasible solution was found.
    const result = await runGA(inputData, config);

    if (result.bestFitness.isFeasible) {
      assert.isBelow(
        result.stats.length,
        config.maxGenerations,
        "Should stop before max generations if feasible solution is found",
      );
    } else {
      // If no feasible solution was found, it should run until another limit is hit
      assert.strictEqual(
        result.stats.length,
        config.maxGenerations,
        "Should run until max generations if no feasible solution is found",
      );
    }
  });
});
