import {
  Chromosome,
  GAInputData,
  FitnessResult,
  ScheduledEvent,
} from "./types";
import { Prisma } from "generated/prisma/client";

/**
 * Converts a chromosome into an array of LectureSlot create data objects.
 * @param chromosome The chromosome to convert.
 * @param inputData The GA input data containing lookup maps.
 * @returns An array of objects for Prisma's `createMany`.
 */
export function chromosomeToLectureSlots(
  chromosome: Chromosome,
  inputData: GAInputData,
): Prisma.LectureSlotCreateManyInput[] {
  return chromosome.map((gene) => {
    const lecture = inputData.lookupMaps.eventToLecture.get(
      gene.lectureEventId,
    );
    if (!lecture) {
      // This should ideally not happen if data is consistent
      throw new Error(
        `Could not find lecture for event ${gene.lectureEventId}`,
      );
    }
    return {
      lectureId: lecture.id,
      slotId: gene.timeslotId,
      isLocked: gene.isLocked,
    };
  });
}

/**
 * Converts the best chromosome into a rich JSON structure for API responses.
 * Follows the structure from research document Section 7.2.
 * @param chromosome The best chromosome.
 * @param inputData The GA input data.
 * @param fitnessResult The fitness result for the best chromosome.
 * @param timetableId The ID of the timetable.
 * @returns A structured JSON object representing the timetable.
 */
export function chromosomeToJSON(
  chromosome: Chromosome,
  inputData: GAInputData,
  fitnessResult: FitnessResult,
  timetableId: string,
) {
  const schedule: Record<string, Record<string, ScheduledEvent[]>> = {};

  for (const gene of chromosome) {
    const slot = inputData.lookupMaps.slotIdToSlot.get(gene.timeslotId);
    const lecture = inputData.lookupMaps.eventToLecture.get(
      gene.lectureEventId,
    );

    if (!slot || !lecture) continue;

    // Get combined classrooms for this lecture (immutable)
    const combinedClassroomIds =
      inputData.lookupMaps.lectureToCombinedClassrooms.get(lecture.id) || [];

    // Get classroom details
    const classrooms = combinedClassroomIds
      .map((id) => inputData.lookupMaps.classroomIdToClassroom.get(id))
      .filter((c) => c !== undefined);

    if (classrooms.length === 0) {
      console.warn(
        `No combined classrooms found for lecture ${lecture.id}, skipping event ${gene.lectureEventId}`,
      );
      continue;
    }

    const day = `Day${slot.day}`;
    const period = `Period${slot.number}`;

    if (!schedule[day]) {
      schedule[day] = {};
    }
    if (!schedule[day][period]) {
      schedule[day][period] = [];
    }

    const subdivisionIds =
      inputData.lookupMaps.lectureToSubdivisions.get(lecture.id) || [];
    const subdivisions = subdivisionIds
      .map((id) => inputData.subdivisions.find((s) => s.id === id))
      .filter(Boolean);

    // For now, use the first classroom for backward compatibility
    // TODO: Update ScheduledEvent interface to support multiple combined classrooms
    const primaryClassroom = classrooms[0]!;

    schedule[day][period]?.push({
      lectureEventId: gene.lectureEventId,
      lectureId: lecture.id,
      lectureName: lecture.subject.name,
      teacherId: lecture.teacher.id,
      teacherName: lecture.teacher.name,
      subdivisionIds: subdivisions.map((s) => s!.id),
      subdivisionNames: subdivisions.map((s) => s!.name),
      classroomId: primaryClassroom.id,
      classroomName: primaryClassroom.name,
      slotId: slot.id,
      day: slot.day,
      period: slot.number,
      duration: lecture.duration,
      isLocked: gene.isLocked,
    });
  }

  return {
    timetableId,
    generationDate: new Date().toISOString(),
    fitnessScore: fitnessResult.fitnessScore,
    isFeasible: fitnessResult.isFeasible,
    hardConstraintViolations: fitnessResult.hardViolationCount,
    softConstraintViolations: fitnessResult.softViolationCount,
    schedule,
  };
}
