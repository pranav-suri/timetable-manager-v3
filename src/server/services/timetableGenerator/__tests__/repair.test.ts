/**
 * Unit tests for Repair Mechanism
 *
 * This test file validates the chromosome repair functionality.
 * Run with: node --import tsx --test src/server/services/timetableGenerator/__tests__/repair.test.ts
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { Chromosome, GAInputData, GALecture } from "../types";
import { DEFAULT_GA_CONFIG } from "../config";
import { repairChromosome } from "../repair";

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

  return {
    timetableId: "test-tt",
    lectures: [mockLecture1],
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
    eventIds: ["lec1-evt0", "lec1-evt1"],
    totalEvents: 2,
    lookupMaps: {
      teacherToLectures: new Map([["teacher1", ["lec1-evt0", "lec1-evt1"]]]),
      subdivisionToLectures: new Map(),
      lectureToSubdivisions: new Map(),
      lectureToAllowedClassrooms: new Map([["lec1", ["room1", "room2"]]]),
      eventToLecture: new Map([
        ["lec1-evt0", mockLecture1],
        ["lec1-evt1", mockLecture1],
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

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

describe("Repair Mechanism", () => {
  test("repairChromosome does not modify original chromosome", () => {
    const inputData = createMockInputData();
    const chromosome: Chromosome = [
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
        timeslotId: "slot1", // Same slot - creates conflict
        classroomId: "room2",
        isLocked: false,
        duration: 1,
      },
    ];

    const originalTimeslot0 = chromosome[0]!.timeslotId;
    const originalTimeslot1 = chromosome[1]!.timeslotId;

    repairChromosome(chromosome, inputData, DEFAULT_GA_CONFIG);

    // Original should be unchanged
    assert.strictEqual(
      chromosome[0]!.timeslotId,
      originalTimeslot0,
      "Original chromosome gene 0 should not be modified",
    );
    assert.strictEqual(
      chromosome[1]!.timeslotId,
      originalTimeslot1,
      "Original chromosome gene 1 should not be modified",
    );
  });

  test("repairChromosome returns a valid chromosome", () => {
    const inputData = createMockInputData();
    const chromosome: Chromosome = [
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

    const repaired = repairChromosome(chromosome, inputData, DEFAULT_GA_CONFIG);

    assert.strictEqual(
      repaired.length,
      chromosome.length,
      "Repaired chromosome should have same length",
    );

    repaired.forEach((gene) => {
      assert.ok(gene.lectureEventId, "Gene should have lectureEventId");
      assert.ok(gene.timeslotId, "Gene should have timeslotId");
      assert.ok(gene.classroomId, "Gene should have classroomId");
    });
  });

  test("repairChromosome preserves locked genes", () => {
    const inputData = createMockInputData();
    const chromosome: Chromosome = [
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
        timeslotId: "slot1", // Same slot - conflict with locked gene
        classroomId: "room2",
        isLocked: false,
        duration: 1,
      },
    ];

    const repaired = repairChromosome(chromosome, inputData, DEFAULT_GA_CONFIG);

    // Locked gene should never change
    assert.strictEqual(
      repaired[0]!.timeslotId,
      "slot1",
      "Locked gene slot should not change",
    );
    assert.strictEqual(
      repaired[0]!.classroomId,
      "room1",
      "Locked gene classroom should not change",
    );
    assert.strictEqual(
      repaired[0]!.isLocked,
      true,
      "Gene should remain locked",
    );
  });

  test("repairChromosome maintains gene metadata", () => {
    const inputData = createMockInputData();
    const chromosome: Chromosome = [
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

    const repaired = repairChromosome(chromosome, inputData, DEFAULT_GA_CONFIG);

    // Metadata should be preserved
    assert.strictEqual(
      repaired[0]!.lectureEventId,
      "lec1-evt0",
      "Event ID should be preserved",
    );
    assert.strictEqual(
      repaired[0]!.lectureId,
      "lec1",
      "Lecture ID should be preserved",
    );
    assert.strictEqual(
      repaired[0]!.duration,
      1,
      "Duration should be preserved",
    );

    assert.strictEqual(
      repaired[1]!.lectureEventId,
      "lec1-evt1",
      "Event ID should be preserved",
    );
    assert.strictEqual(
      repaired[1]!.lectureId,
      "lec1",
      "Lecture ID should be preserved",
    );
    assert.strictEqual(
      repaired[1]!.duration,
      1,
      "Duration should be preserved",
    );
  });

  test("repairChromosome handles chromosome with no violations", () => {
    const inputData = createMockInputData();
    const chromosome: Chromosome = [
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
        timeslotId: "slot2", // Different slot - no conflict
        classroomId: "room2",
        isLocked: false,
        duration: 1,
      },
    ];

    const repaired = repairChromosome(chromosome, inputData, DEFAULT_GA_CONFIG);

    // Should return a valid chromosome even with no violations
    assert.strictEqual(repaired.length, 2, "Should have 2 genes");
    assert.ok(repaired[0]!.timeslotId, "Gene 0 should have timeslot");
    assert.ok(repaired[1]!.timeslotId, "Gene 1 should have timeslot");
  });

  test("repairChromosome runs in reasonable time", () => {
    const inputData = createMockInputData();
    const chromosome: Chromosome = [
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
        timeslotId: "slot1", // Conflict
        classroomId: "room1", // Double conflict
        isLocked: false,
        duration: 1,
      },
    ];

    const startTime = Date.now();
    repairChromosome(chromosome, inputData, DEFAULT_GA_CONFIG);
    const elapsed = Date.now() - startTime;

    // Should complete in less than 50ms for this simple case
    assert.ok(elapsed < 50, `Repair should be fast (took ${elapsed}ms)`);
  });
});
