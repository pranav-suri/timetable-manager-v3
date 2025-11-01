import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import { verifyTimetableOwnership } from "../utils/verifyTimetableOwnership";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const lectureClassroomsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const lectures = await prisma.lecture.findMany({
        where: { timetableId },
      });
      const lectureClassrooms = await prisma.lectureClassroom.findMany({
        where: { lectureId: { in: lectures.map((lecture) => lecture.id) } },
      });
      return { lectureClassrooms };
    }),
  add: editorProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        classroomId: zodIdSchema,
        lectureId: zodIdSchema,
        timetableId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, classroomId, lectureId, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const lectureClassroom = await prisma.lectureClassroom.create({
        data: { id, classroomId, lectureId },
      });
      return { lectureClassroom };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema, timetableId: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const lectureClassroom = await prisma.lectureClassroom.delete({
        where: { id },
      });
      return { lectureClassroom };
    }),
} satisfies TRPCRouterRecord;
