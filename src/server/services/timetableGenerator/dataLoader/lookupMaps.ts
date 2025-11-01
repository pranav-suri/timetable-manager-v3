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
  const slotLinearization = new Map<string, number>();
  const linearToSlotId = new Map<number, string>();
  const classroomIdToClassroom = new Map<string, GAClassroom>();
  const classroomCapacity = new Map<string, number>();
  const lockedAssignments = new Map<string, { slotId: string }>();
  const locked = new Map<string, string>(); // lectureEventId -> timeslotId

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

  slots.forEach((slot, index) => {
    slotIdToSlot.set(slot.id, slot);
    slotLinearization.set(slot.id, index);
    linearToSlotId.set(index, slot.id);
  });

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

    for (let eventIndex = 0; eventIndex < lecture.count; eventIndex++) {
      const lectureEventId = `${lecture.id}-evt${eventIndex}`;
      eventToLecture.set(lectureEventId, lecture);
      eventToSubdivisions.set(lectureEventId, subdivisionIds);
      teacherToLectures.get(lecture.teacherId)!.push(lectureEventId);

      for (const subdivisionId of subdivisionIds) {
        subdivisionToLectures.get(subdivisionId)!.push(lectureEventId);
      }

      const lockedSlot = lecture.lockedSlots[eventIndex];
      if (lockedSlot?.isLocked) {
        lockedAssignments.set(lectureEventId, { slotId: lockedSlot.slotId });
        locked.set(lectureEventId, lockedSlot.slotId);
      }
    }
  }

  for (const classroom of classrooms) {
    classroomCapacity.set(classroom.id, 100);
    classroomIdToClassroom.set(classroom.id, classroom);
  }

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
    slotLinearization,
    linearToSlotId,
    classroomIdToClassroom,
    classroomCapacity,
    lockedAssignments,
    locked,
  };
}
