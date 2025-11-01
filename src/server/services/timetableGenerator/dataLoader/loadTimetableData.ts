import { DEFAULT_GA_CONFIG } from "../config";
import {
  loadClassrooms,
  loadLectures,
  loadSlots,
  loadSubdivisions,
  loadTeachers,
} from "./loaders";
import { buildLookupMaps } from "./lookupMaps";
import type { PrismaClient } from "generated/prisma/client";
import type { GAInputData } from "../types";

export async function loadTimetableData(
  timetableId: string,
  prisma: PrismaClient,
): Promise<GAInputData> {
  const [lectures, teachers, subdivisions, classrooms, slots] =
    await Promise.all([
      loadLectures(timetableId, prisma),
      loadTeachers(timetableId, prisma),
      loadSubdivisions(timetableId, prisma),
      loadClassrooms(timetableId, prisma),
      loadSlots(timetableId, prisma),
    ]);

  // Validate basic completeness (kept simple)
  if (lectures.length === 0) throw new Error("No lectures to schedule");
  if (teachers.length === 0) throw new Error("No teachers found");

  const totalEvents = lectures.reduce(
    (sum: number, l: { count: number }) => sum + l.count,
    0,
  );
  const eventIds: string[] = [];
  for (const lecture of lectures) {
    for (let i = 0; i < lecture.count; i++) {
      eventIds.push(`${lecture.id}-evt${i}`);
    }
  }

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
    config: DEFAULT_GA_CONFIG,
  };
}
