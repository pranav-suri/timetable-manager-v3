import type {
  GAClassroom,
  GALecture,
  GASlot,
  GASubdivision,
  GATeacher,
  LookupMaps,
} from "../types";

export function buildLookupMaps(data: {
  lectures: GALecture[];
  teachers: GATeacher[];
  subdivisions: GASubdivision[];
  classrooms: GAClassroom[];
  slots: GASlot[];
}): LookupMaps {
  const { lectures, teachers, subdivisions, classrooms, slots } = data;

  // --- DECLARATIONS ---
  const teacherToLectures = new Map<string, string[]>();
  const subdivisionToLectures = new Map<string, string[]>();
  const lectureToSubdivisions = new Map<string, string[]>();
  const lectureToCombinedClassrooms = new Map<string, string[]>();
  const eventToLecture = new Map<string, GALecture>();
  const eventToSubdivisions = new Map<string, string[]>();
  const teacherUnavailable = new Map<string, Set<string>>();
  const subdivisionUnavailable = new Map<string, Set<string>>();
  const classroomUnavailable = new Map<string, Set<string>>();
  const slotIdToSlot = new Map<string, GASlot>();
  const slotToNextSlotId = new Map<string, string | undefined>(); // Added in a previous step
  const slotLinearization = new Map<string, number>();
  const linearToSlotId = new Map<number, string>();
  const classroomIdToClassroom = new Map<string, GAClassroom>();
  const classroomCapacity = new Map<string, number>();
  const lockedAssignments = new Map<string, { slotId: string }>();
  // *** THIS WAS THE MISSING DECLARATION ***
  const permanentlyOccupiedSlots = new Set<string>();

  // --- POPULATE UNAVAILABILITY MAPS ---
  for (const teacher of teachers) {
    const unavailableSet = new Set(
      teacher.unavailableSlots.map((slot) => slot.slotId),
    );
    teacherUnavailable.set(teacher.id, unavailableSet);
  }

  for (const subdivision of subdivisions) {
    const unavailableSet = new Set(
      subdivision.unavailableSlots.map((slot) => slot.slotId),
    );
    subdivisionUnavailable.set(subdivision.id, unavailableSet);
  }

  for (const classroom of classrooms) {
    const unavailableSet = new Set(
      classroom.unavailableSlots.map((slot) => slot.slotId),
    );
    classroomUnavailable.set(classroom.id, unavailableSet);
  }

  // --- POPULATE SLOT-RELATED MAPS (MUST RUN EARLY) ---
  // Ensure slots are sorted to correctly build the consecutive map
  const sortedSlots = [...slots].sort((a, b) =>
    a.day !== b.day ? a.day - b.day : a.number - b.number,
  );

  sortedSlots.forEach((slot, index) => {
    slotIdToSlot.set(slot.id, slot);
    slotLinearization.set(slot.id, index);
    linearToSlotId.set(index, slot.id);

    // Check the next slot in the sorted array to find the consecutive one
    if (index < sortedSlots.length - 1) {
      const nextSlot = sortedSlots[index + 1]!;
      if (nextSlot.day === slot.day && nextSlot.number === slot.number + 1) {
        slotToNextSlotId.set(slot.id, nextSlot.id);
      }
    }
  });

  // --- MAIN LECTURE PROCESSING LOOP ---
  for (const lecture of lectures) {
    if (!teacherToLectures.has(lecture.teacherId)) {
      teacherToLectures.set(lecture.teacherId, []);
    }

    const subdivisionIds = lecture.subdivisions.map((ls) => ls.subdivisionId);
    lectureToSubdivisions.set(lecture.id, subdivisionIds);

    for (const subdivisionId of subdivisionIds) {
      if (!subdivisionToLectures.has(subdivisionId)) {
        subdivisionToLectures.set(subdivisionId, []);
      }
    }

    const combinedClassroomIds = lecture.combinedClassrooms.map(
      (lc) => lc.classroomId,
    );
    lectureToCombinedClassrooms.set(lecture.id, combinedClassroomIds);

    // --- NEW, ROBUST LOCKING LOGIC ---
    const allLockedSlotsForLecture = lecture.lockedSlots
      .filter((ls) => ls.isLocked)
      .map((ls) => ls.slotId);

    if (allLockedSlotsForLecture.length > 0) {
      const sortedLockedSlotObjects = allLockedSlotsForLecture
        .map((slotId) => slotIdToSlot.get(slotId)!)
        .filter(Boolean)
        .sort((a, b) =>
          a.day !== b.day ? a.day - b.day : a.number - b.number,
        );

      const startSlot = sortedLockedSlotObjects[0];
      if (startSlot) {
        // Assign the lock to the first event instance of this lecture.
        const lectureEventId = `${lecture.id}-evt0`;
        lockedAssignments.set(lectureEventId, { slotId: startSlot.id });

        // Populate the permanentlyOccupiedSlots based on this start time.
        let slotToOccupy: string | undefined = startSlot.id;
        for (let i = 0; i < lecture.duration; i++) {
          if (!slotToOccupy) break;
          permanentlyOccupiedSlots.add(slotToOccupy);
          slotToOccupy = slotToNextSlotId.get(slotToOccupy);
        }
      }
    }

    // --- POPULATE EVENT-LEVEL MAPS ---
    for (let eventIndex = 0; eventIndex < lecture.count; eventIndex++) {
      const lectureEventId = `${lecture.id}-evt${eventIndex}`;
      eventToLecture.set(lectureEventId, lecture);
      eventToSubdivisions.set(lectureEventId, subdivisionIds);
      teacherToLectures.get(lecture.teacherId)!.push(lectureEventId);

      for (const subdivisionId of subdivisionIds) {
        subdivisionToLectures.get(subdivisionId)!.push(lectureEventId);
      }
    }
  }

  for (const classroom of classrooms) {
    // Assuming a placeholder capacity. This should be loaded from the DB.
    classroomCapacity.set(classroom.id, 100);
    classroomIdToClassroom.set(classroom.id, classroom);
  }

  // --- RETURN ALL MAPS ---
  return {
    teacherToLectures,
    subdivisionToLectures,
    lectureToSubdivisions,
    lectureToCombinedClassrooms,
    eventToLecture,
    eventToSubdivisions,
    teacherUnavailable,
    subdivisionUnavailable,
    classroomUnavailable,
    slotIdToSlot,
    slotToNextSlotId,
    slotLinearization,
    linearToSlotId,
    classroomIdToClassroom,
    classroomCapacity,
    lockedAssignments,
  };
}
