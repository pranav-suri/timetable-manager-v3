/**
 * Test file for Crossover and Repair functionality
 *
 * This file contains basic validation tests for the crossover operator.
 * Run with: node --import tsx --test src/server/services/timetableGenerator/__tests__/crossover.test.ts
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { Chromosome, GAInputData, GAConfig } from "../types";
import { DEFAULT_GA_CONFIG } from "../config";
import { uniformCrossover, crossover } from "../crossover";

/**
 * Create a simple mock input data for testing
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
    eventIds: ["evt1", "evt2", "evt3", "evt4"],
    totalEvents: 4,
    lookupMaps: {
      teacherToLectures: new Map(),
      subdivisionToLectures: new Map(),
      lectureToSubdivisions: new Map(),
      lectureToAllowedClassrooms: new Map([
        ["lec1", ["room1", "room2"]],
        ["lec2", ["room1", "room2"]],
      ]),
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

describe("Crossover Operator", () => {
  test("Uniform crossover produces two offspring", () => {
    const parent1: Chromosome = [
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
        lectureId: "lec1",
        timeslotId: "slot2",
        classroomId: "room2",
        isLocked: false,
        duration: 1,
      },
      {
        lectureEventId: "evt3",
        lectureId: "lec2",
        timeslotId: "slot3",
        classroomId: "room1",
        isLocked: false,
        duration: 1,
      },
      {
        lectureEventId: "evt4",
        lectureId: "lec2",
        timeslotId: "slot1",
        classroomId: "room2",
        isLocked: false,
        duration: 1,
      },
    ];

    const parent2: Chromosome = [
      {
        lectureEventId: "evt1",
        lectureId: "lec1",
        timeslotId: "slot2",
        classroomId: "room2",
        isLocked: false,
        duration: 1,
      },
      {
        lectureEventId: "evt2",
        lectureId: "lec1",
        timeslotId: "slot1",
        classroomId: "room1",
        isLocked: false,
        duration: 1,
      },
      {
        lectureEventId: "evt3",
        lectureId: "lec2",
        timeslotId: "slot1",
        classroomId: "room2",
        isLocked: false,
        duration: 1,
      },
      {
        lectureEventId: "evt4",
        lectureId: "lec2",
        timeslotId: "slot3",
        classroomId: "room1",
        isLocked: false,
        duration: 1,
      },
    ];

    const [offspring1, offspring2] = uniformCrossover(
      parent1,
      parent2,
      DEFAULT_GA_CONFIG,
    );

    // Validate offspring length
    assert.strictEqual(
      offspring1.length,
      parent1.length,
      "Offspring1 should have same length as parent",
    );
    assert.strictEqual(
      offspring2.length,
      parent2.length,
      "Offspring2 should have same length as parent",
    );

    // Validate that genes come from one parent or the other
    let genesFromParents = 0;
    for (let i = 0; i < offspring1.length; i++) {
      const o1Gene = offspring1[i]!;
      const p1Gene = parent1[i]!;
      const p2Gene = parent2[i]!;

      const matchesP1 =
        o1Gene.timeslotId === p1Gene.timeslotId &&
        o1Gene.classroomId === p1Gene.classroomId;
      const matchesP2 =
        o1Gene.timeslotId === p2Gene.timeslotId &&
        o1Gene.classroomId === p2Gene.classroomId;

      if (matchesP1 || matchesP2) {
        genesFromParents++;
      }
    }

    assert.ok(
      genesFromParents > 0,
      "Genes should come from one parent or the other",
    );
  });

  test("Locked genes are preserved", () => {
    const parent1: Chromosome = [
      {
        lectureEventId: "evt1",
        lectureId: "lec1",
        timeslotId: "slot1",
        classroomId: "room1",
        isLocked: true, // LOCKED
        duration: 1,
      },
      {
        lectureEventId: "evt2",
        lectureId: "lec1",
        timeslotId: "slot2",
        classroomId: "room2",
        isLocked: false,
        duration: 1,
      },
    ];

    const parent2: Chromosome = [
      {
        lectureEventId: "evt1",
        lectureId: "lec1",
        timeslotId: "slot3",
        classroomId: "room2",
        isLocked: false,
        duration: 1,
      },
      {
        lectureEventId: "evt2",
        lectureId: "lec1",
        timeslotId: "slot1",
        classroomId: "room1",
        isLocked: false,
        duration: 1,
      },
    ];

    const [offspring1, offspring2] = uniformCrossover(
      parent1,
      parent2,
      DEFAULT_GA_CONFIG,
    );

    // First gene should be locked in both offspring with slot1
    assert.strictEqual(
      offspring1[0]!.timeslotId,
      "slot1",
      "Offspring1 gene 0 should preserve locked timeslot",
    );
    assert.strictEqual(
      offspring2[0]!.timeslotId,
      "slot1",
      "Offspring2 gene 0 should preserve locked timeslot",
    );
    assert.strictEqual(
      offspring1[0]!.isLocked,
      true,
      "Offspring1 gene 0 should be locked",
    );
    assert.strictEqual(
      offspring2[0]!.isLocked,
      true,
      "Offspring2 gene 0 should be locked",
    );
  });

  test("Crossover probability control", () => {
    const parent1: Chromosome = [
      {
        lectureEventId: "evt1",
        lectureId: "lec1",
        timeslotId: "slot1",
        classroomId: "room1",
        isLocked: false,
        duration: 1,
      },
    ];

    const parent2: Chromosome = [
      {
        lectureEventId: "evt1",
        lectureId: "lec1",
        timeslotId: "slot2",
        classroomId: "room2",
        isLocked: false,
        duration: 1,
      },
    ];

    const inputData = createMockInputData();
    const config: GAConfig = {
      ...DEFAULT_GA_CONFIG,
      crossoverProbability: 0.0, // Never crossover
    };

    const [offspring1, offspring2] = crossover(
      parent1,
      parent2,
      inputData,
      config,
    );

    // With probability 0, offspring should be copies of parents
    assert.strictEqual(
      offspring1[0]!.timeslotId,
      parent1[0]!.timeslotId,
      "With prob 0, offspring1 should match parent1",
    );
    assert.strictEqual(
      offspring2[0]!.timeslotId,
      parent2[0]!.timeslotId,
      "With prob 0, offspring2 should match parent2",
    );
  });
});
