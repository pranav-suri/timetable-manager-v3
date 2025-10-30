// tRPC router for cognitive load tracking
// Exposes API procedures for cognitive load calculations

import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import { calculateCognitiveLoad, detectConflicts } from "@/utils/cognitiveLoad";

export const cognitiveLoadRouter = {
  // Get cognitive load for all teachers in a timetable
  getTeacherLoads: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      // Fetch lectures and teacher unavailabilities
      const [lectures, teacherUnavailables] = await Promise.all([
        prisma.lecture.findMany({
          where: { timetableId },
          include: {
            teacher: true,
            subject: { include: { group: true } },
          },
        }),
        prisma.teacherUnavailable.findMany({
          where: { teacher: { timetableId } },
        }),
      ]);

      // Calculate cognitive load
      const cognitiveLoads = calculateCognitiveLoad(
        lectures,
        teacherUnavailables,
      );

      return { cognitiveLoads };
    }),

  // Detect conflicts in timetable
  detectConflicts: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      // Fetch all relevant data
      const [
        lectures,
        teacherUnavailables,
        classroomUnavailables,
        subdivisionUnavailables,
      ] = await Promise.all([
        prisma.lecture.findMany({
          where: { timetableId },
          include: {
            teacher: true,
            subject: { include: { group: true } },
            lectureSlots: true,
            lectureClassrooms: true,
            lectureSubdivisions: true,
          },
        }),
        prisma.teacherUnavailable.findMany({
          where: { teacher: { timetableId } },
        }),
        prisma.classroomUnavailable.findMany({
          where: { classroom: { timetableId } },
        }),
        prisma.subdivisionUnavailable.findMany({
          where: { subdivision: { timetableId } },
        }),
      ]);

      // Detect conflicts
      const conflicts = detectConflicts(
        lectures,
        teacherUnavailables,
        classroomUnavailables,
        subdivisionUnavailables,
      );

      return { conflicts };
    }),

  // Get comprehensive timetable health report
  getHealthReport: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      // Fetch all relevant data
      const [
        lectures,
        teacherUnavailables,
        classroomUnavailables,
        subdivisionUnavailables,
        teachers,
        classrooms,
        subdivisions,
      ] = await Promise.all([
        prisma.lecture.findMany({
          where: { timetableId },
          include: {
            teacher: true,
            subject: { include: { group: true } },
            lectureSlots: true,
            lectureClassrooms: true,
            lectureSubdivisions: true,
          },
        }),
        prisma.teacherUnavailable.findMany({
          where: { teacher: { timetableId } },
        }),
        prisma.classroomUnavailable.findMany({
          where: { classroom: { timetableId } },
        }),
        prisma.subdivisionUnavailable.findMany({
          where: { subdivision: { timetableId } },
        }),
        prisma.teacher.findMany({ where: { timetableId } }),
        prisma.classroom.findMany({ where: { timetableId } }),
        prisma.subdivision.findMany({ where: { timetableId } }),
      ]);

      // Calculate cognitive load
      const cognitiveLoads = calculateCognitiveLoad(
        lectures,
        teacherUnavailables,
      );

      // Detect conflicts
      const conflicts = detectConflicts(
        lectures,
        teacherUnavailables,
        classroomUnavailables,
        subdivisionUnavailables,
      );

      // Calculate statistics
      const totalLectures = lectures.reduce((sum, l) => sum + l.count, 0);
      const assignedLectures = lectures.reduce(
        (sum, l) => sum + (l.lectureSlots.length || 0),
        0,
      );
      const unassignedLectures = totalLectures - assignedLectures;

      // Calculate average cognitive load
      const avgCognitiveLoad =
        cognitiveLoads.reduce((sum, cl) => sum + cl.load, 0) /
        (cognitiveLoads.length || 1);

      // Find teachers with high cognitive load (>70)
      const overloadedTeachers = cognitiveLoads.filter((cl) => cl.load > 70);

      return {
        summary: {
          totalTeachers: teachers.length,
          totalClassrooms: classrooms.length,
          totalSubdivisions: subdivisions.length,
          totalLectures,
          assignedLectures,
          unassignedLectures,
          completionPercentage: (assignedLectures / totalLectures) * 100,
          conflictCount: conflicts.length,
          avgCognitiveLoad,
          overloadedTeachersCount: overloadedTeachers.length,
        },
        cognitiveLoads,
        conflicts,
        overloadedTeachers,
      };
    }),
} satisfies TRPCRouterRecord;
