/**
 * Data Transformation Layer for Timetable Generator
 *
 * This module handles loading data from the database and transforming it
 * into GA-optimized data structures.
 *
 * Key responsibilities:
 * - Load all timetable entities from Prisma
 * - Expand lectures into individual schedulable events
 * - Build lookup maps for O(1) constraint checking
 * - Linearize slots for efficient representation
 * - Validate data completeness
 */

import type { PrismaClient } from "generated/prisma/client";
import type {
  GAInputData,
  GALecture,
  GATeacher,
  GASubdivision,
  GAClassroom,
  GASlot,
  LookupMaps,
} from "./types";

/**
 * Load all timetable data from database and transform to GA-optimized structures.
 *
 * @param timetableId - The ID of the timetable to generate
 * @param prisma - Prisma client instance
 * @returns Complete GA input data with all entities and lookup maps
 * @throws Error if data is invalid or insufficient
 */
export async function loadTimetableData(
  timetableId: string,
  prisma: PrismaClient,
): Promise<GAInputData> {
  // Load all entities with necessary relationships
  const [lectures, teachers, subdivisions, classrooms, slots] =
    await Promise.all([
      loadLectures(timetableId, prisma),
      loadTeachers(timetableId, prisma),
      loadSubdivisions(timetableId, prisma),
      loadClassrooms(timetableId, prisma),
      loadSlots(timetableId, prisma),
    ]);

  // Validate data
  validateInputData({ lectures, teachers, subdivisions, classrooms, slots });

  // Calculate total events (sum of all lecture counts)
  const totalEvents = lectures.reduce((sum, lecture) => sum + lecture.count, 0);

  if (totalEvents === 0) {
    throw new Error("No lectures to schedule");
  }

  // Generate ordered list of all event IDs
  const eventIds: string[] = [];
  for (const lecture of lectures) {
    for (let i = 0; i < lecture.count; i++) {
      eventIds.push(`${lecture.id}-evt${i}`);
    }
  }

  // Build lookup maps for efficient constraint checking
  const lookupMaps = buildLookupMaps({
    lectures,
    teachers,
    subdivisions,
    classrooms,
    slots,
  });

  return {
    timetableId,
    lectures,
    teachers,
    subdivisions,
    classrooms,
    slots,
    totalEvents,
    eventIds,
    lookupMaps,
  };
}

/**
 * Load lectures with all necessary relationships.
 */
async function loadLectures(
  timetableId: string,
  prisma: PrismaClient,
): Promise<GALecture[]> {
  const lectures = await prisma.lecture.findMany({
    where: { timetableId },
    include: {
      lectureSubdivisions: {
        include: {
          subdivision: true,
        },
      },
      lectureClassrooms: {
        include: {
          classroom: true,
        },
      },
      lectureSlots: {
        include: {
          slot: true,
        },
      },
      subject: {
        include: {
          group: true,
        },
      },
      teacher: {
        include: {
          slots: true,
        },
      },
    },
  });

  // Transform to GALecture format
  return lectures.map((lecture) => ({
    id: lecture.id,
    teacherId: lecture.teacherId,
    subjectId: lecture.subjectId,
    timetableId: lecture.timetableId,
    count: lecture.count,
    duration: lecture.duration,
    createdAt: lecture.createdAt,
    subdivisions: lecture.lectureSubdivisions.map((ls) => ({
      id: ls.id,
      subdivisionId: ls.subdivisionId,
      lectureId: ls.lectureId,
    })),
    allowedClassrooms: lecture.lectureClassrooms.map((lc) => ({
      id: lc.id,
      classroomId: lc.classroomId,
      lectureId: lc.lectureId,
    })),
    lockedSlots: lecture.lectureSlots.map((ls) => ({
      id: ls.id,
      slotId: ls.slotId,
      lectureId: ls.lectureId,
      isLocked: ls.isLocked,
    })),
    subject: {
      id: lecture.subject.id,
      name: lecture.subject.name,
      groupId: lecture.subject.groupId,
      group: {
        id: lecture.subject.group.id,
        name: lecture.subject.group.name,
        allowSimultaneous: lecture.subject.group.allowSimultaneous,
        timetableId: lecture.subject.group.timetableId,
      },
    },
    teacher: {
      ...lecture.teacher,
      unavailableSlots: lecture.teacher.slots.map((slot) => ({
        id: slot.id,
        slotId: slot.slotId,
        teacherId: slot.teacherId,
      })),
    },
  }));
}

/**
 * Load teachers with unavailability information.
 */
async function loadTeachers(
  timetableId: string,
  prisma: PrismaClient,
): Promise<GATeacher[]> {
  const teachers = await prisma.teacher.findMany({
    where: { timetableId },
    include: {
      slots: true, // TeacherUnavailable
    },
  });

  return teachers.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    timetableId: teacher.timetableId,
    dailyMaxHours: teacher.dailyMaxHours,
    weeklyMaxHours: teacher.weeklyMaxHours,
    unavailableSlots: teacher.slots.map((slot) => ({
      id: slot.id,
      slotId: slot.slotId,
      teacherId: slot.teacherId,
    })),
  }));
}

/**
 * Load subdivisions with unavailability information.
 */
async function loadSubdivisions(
  timetableId: string,
  prisma: PrismaClient,
): Promise<GASubdivision[]> {
  const subdivisions = await prisma.subdivision.findMany({
    where: { timetableId },
    include: {
      subdivsionUnavailables: true, // Note: typo in schema name
    },
  });

  return subdivisions.map((subdivision) => ({
    id: subdivision.id,
    name: subdivision.name,
    timetableId: subdivision.timetableId,
    unavailableSlots: subdivision.subdivsionUnavailables.map((slot) => ({
      id: slot.id,
      slotId: slot.slotId,
      subdivisionId: slot.subdivisionId,
      timetableId: slot.timetableId,
    })),
  }));
}

/**
 * Load classrooms with unavailability information.
 */
async function loadClassrooms(
  timetableId: string,
  prisma: PrismaClient,
): Promise<GAClassroom[]> {
  const classrooms = await prisma.classroom.findMany({
    where: { timetableId },
    include: {
      slots: true, // ClassroomUnavailable
    },
  });

  return classrooms.map((classroom) => ({
    id: classroom.id,
    name: classroom.name,
    timetableId: classroom.timetableId,
    unavailableSlots: classroom.slots.map((slot) => ({
      id: slot.id,
      slotId: slot.slotId,
      classroomId: slot.classroomId,
    })),
  }));
}

/**
 * Load slots.
 */
async function loadSlots(
  timetableId: string,
  prisma: PrismaClient,
): Promise<GASlot[]> {
  const slots = await prisma.slot.findMany({
    where: { timetableId },
    orderBy: [{ day: "asc" }, { number: "asc" }],
  });

  return slots.map((slot) => ({
    id: slot.id,
    day: slot.day,
    number: slot.number,
    timetableId: slot.timetableId,
    createdAt: slot.createdAt,
  }));
}

/**
 * Validate that input data is complete and sufficient for generation.
 */
function validateInputData(data: {
  lectures: GALecture[];
  teachers: GATeacher[];
  subdivisions: GASubdivision[];
  classrooms: GAClassroom[];
  slots: GASlot[];
}): void {
  const { lectures, teachers, subdivisions, classrooms, slots } = data;

  // Check for empty data
  if (lectures.length === 0) {
    throw new Error("No lectures found in timetable");
  }

  if (teachers.length === 0) {
    throw new Error("No teachers found in timetable");
  }

  if (subdivisions.length === 0) {
    throw new Error("No subdivisions (student groups) found in timetable");
  }

  if (classrooms.length === 0) {
    throw new Error("No classrooms found in timetable");
  }

  if (slots.length === 0) {
    throw new Error("No time slots found in timetable");
  }

  // Validate each lecture has necessary associations
  for (const lecture of lectures) {
    if (lecture.count <= 0) {
      throw new Error(
        `Lecture ${lecture.id} has invalid count: ${lecture.count}`,
      );
    }

    if (lecture.duration <= 0) {
      throw new Error(
        `Lecture ${lecture.id} has invalid duration: ${lecture.duration}`,
      );
    }

    if (lecture.subdivisions.length === 0) {
      console.warn(
        `Warning: Lecture ${lecture.id} has no associated subdivisions`,
      );
    }

    if (lecture.allowedClassrooms.length === 0) {
      console.warn(
        `Warning: Lecture ${lecture.id} has no allowed classrooms - will use all classrooms`,
      );
    }
  }

  // Warn about potential capacity issues
  const totalEvents = lectures.reduce((sum, lecture) => sum + lecture.count, 0);
  const totalCapacity = slots.length * classrooms.length;

  if (totalEvents > totalCapacity * 0.8) {
    console.warn(
      `Warning: High utilization detected. ${totalEvents} events to schedule with ${totalCapacity} total capacity (${((totalEvents / totalCapacity) * 100).toFixed(1)}% utilization)`,
    );
  }
}

/**
 * Build lookup maps for efficient constraint checking during evolution.
 */
function buildLookupMaps(data: {
  lectures: GALecture[];
  teachers: GATeacher[];
  subdivisions: GASubdivision[];
  classrooms: GAClassroom[];
  slots: GASlot[];
}): LookupMaps {
  const { lectures, teachers, subdivisions, classrooms, slots } = data;

  // Initialize maps
  const teacherToLectures = new Map<string, string[]>();
  const subdivisionToLectures = new Map<string, string[]>();
  const lectureToSubdivisions = new Map<string, string[]>();
  const lectureToAllowedClassrooms = new Map<string, string[]>();
  const eventToLecture = new Map<string, GALecture>();
  const eventToSubdivisions = new Map<string, string[]>();
  const teacherUnavailable = new Map<string, Set<string>>();
  const subdivisionUnavailable = new Map<string, Set<string>>();
  const classroomUnavailable = new Map<string, Set<string>>();
  const slotIdToSlot = new Map<string, GASlot>();
  const slotLinearization = new Map<string, number>();
  const linearToSlotId = new Map<number, string>();
  const classroomIdToClassroom = new Map<string, GAClassroom>();
  const classroomCapacity = new Map<string, number>(); // classroomId -> capacity
  const lockedAssignments = new Map<
    string,
    { slotId: string; classroomId?: string }
  >();

  // Build teacher unavailability sets
  for (const teacher of teachers) {
    const unavailableSet = new Set(
      teacher.unavailableSlots.map((slot) => slot.slotId),
    );
    teacherUnavailable.set(teacher.id, unavailableSet);
  }

  // Build subdivision unavailability sets
  for (const subdivision of subdivisions) {
    const unavailableSet = new Set(
      subdivision.unavailableSlots.map((slot) => slot.slotId),
    );
    subdivisionUnavailable.set(subdivision.id, unavailableSet);
  }

  // Build classroom unavailability sets
  for (const classroom of classrooms) {
    const unavailableSet = new Set(
      classroom.unavailableSlots.map((slot) => slot.slotId),
    );
    classroomUnavailable.set(classroom.id, unavailableSet);
  }

  // Build slot mappings (linearization)
  slots.forEach((slot, index) => {
    slotIdToSlot.set(slot.id, slot);
    slotLinearization.set(slot.id, index);
    linearToSlotId.set(index, slot.id);
  });

  // Build lecture-related maps and expand events
  for (const lecture of lectures) {
    // Teacher to lectures mapping
    if (!teacherToLectures.has(lecture.teacherId)) {
      teacherToLectures.set(lecture.teacherId, []);
    }

    // Lecture to subdivisions mapping
    const subdivisionIds = lecture.subdivisions.map((ls) => ls.subdivisionId);
    lectureToSubdivisions.set(lecture.id, subdivisionIds);

    // Subdivision to lectures mapping
    for (const subdivisionId of subdivisionIds) {
      if (!subdivisionToLectures.has(subdivisionId)) {
        subdivisionToLectures.set(subdivisionId, []);
      }
    }

    // Lecture to allowed classrooms mapping
    const allowedClassroomIds =
      lecture.allowedClassrooms.length > 0
        ? lecture.allowedClassrooms.map((lc) => lc.classroomId)
        : classrooms.map((c) => c.id); // If none specified, allow all
    lectureToAllowedClassrooms.set(lecture.id, allowedClassroomIds);

    // Expand lecture into individual events
    for (let eventIndex = 0; eventIndex < lecture.count; eventIndex++) {
      const lectureEventId = `${lecture.id}-evt${eventIndex}`;

      // Map event to lecture
      eventToLecture.set(lectureEventId, lecture);

      // Map event to subdivisions
      eventToSubdivisions.set(lectureEventId, subdivisionIds);

      // Add to teacher's lectures
      teacherToLectures.get(lecture.teacherId)!.push(lectureEventId);

      // Add to each subdivision's lectures
      for (const subdivisionId of subdivisionIds) {
        subdivisionToLectures.get(subdivisionId)!.push(lectureEventId);
      }

      // Process locked slots for this event
      const lockedSlot = lecture.lockedSlots[eventIndex];
      if (lockedSlot?.isLocked) {
        lockedAssignments.set(lectureEventId, {
          slotId: lockedSlot.slotId,
          classroomId: undefined, // Classroom may not be locked
        });
      }
    }
  }

  // Note: We don't have classroom capacity in the current schema,
  // so we'll set a default high value. This can be added to schema later.
  for (const classroom of classrooms) {
    classroomCapacity.set(classroom.id, 100); // Default capacity
    classroomIdToClassroom.set(classroom.id, classroom);
  }

  return {
    teacherToLectures,
    subdivisionToLectures,
    lectureToSubdivisions,
    lectureToAllowedClassrooms,
    eventToLecture,
    eventToSubdivisions,
    teacherUnavailable,
    subdivisionUnavailable,
    classroomUnavailable,
    slotIdToSlot,
    slotLinearization,
    linearToSlotId,
    classroomIdToClassroom,
    classroomCapacity,
    lockedAssignments,
  };
}

/**
 * Get the linearized index for a slot.
 * This is useful for converting between slot IDs and array indices.
 */
export function getSlotLinearIndex(
  slotId: string,
  lookupMaps: LookupMaps,
): number {
  const index = lookupMaps.slotLinearization.get(slotId);
  if (index === undefined) {
    throw new Error(`Slot ${slotId} not found in linearization map`);
  }
  return index;
}

/**
 * Get the slot ID from a linearized index.
 */
export function getSlotIdFromLinearIndex(
  index: number,
  lookupMaps: LookupMaps,
): string {
  const slotId = lookupMaps.linearToSlotId.get(index);
  if (!slotId) {
    throw new Error(`No slot found for linear index ${index}`);
  }
  return slotId;
}

/**
 * Check if two slots are consecutive (for multi-slot lectures).
 */
export function areSlotsConsecutive(
  slotId1: string,
  slotId2: string,
  lookupMaps: LookupMaps,
): boolean {
  const slot1 = lookupMaps.slotIdToSlot.get(slotId1);
  const slot2 = lookupMaps.slotIdToSlot.get(slotId2);

  if (!slot1 || !slot2) {
    return false;
  }

  // Same day and consecutive periods
  return slot1.day === slot2.day && slot2.number === slot1.number + 1;
}

/**
 * Get N consecutive slots starting from a given slot.
 * Returns null if not enough consecutive slots available.
 */
export function getConsecutiveSlots(
  startSlotId: string,
  count: number,
  lookupMaps: LookupMaps,
): string[] | null {
  const slots: string[] = [startSlotId];
  let currentSlotId = startSlotId;

  for (let i = 1; i < count; i++) {
    const currentSlot = lookupMaps.slotIdToSlot.get(currentSlotId);
    if (!currentSlot) {
      return null;
    }

    // Find next consecutive slot
    const nextSlot = Array.from(lookupMaps.slotIdToSlot.values()).find(
      (slot) =>
        slot.day === currentSlot.day && slot.number === currentSlot.number + 1,
    );

    if (!nextSlot) {
      return null; // No consecutive slot available
    }

    slots.push(nextSlot.id);
    currentSlotId = nextSlot.id;
  }

  return slots;
}
