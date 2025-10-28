import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import { verifyTimetableOwnership } from "../utils/verifyTimetableOwnership";

export const subjectTeachersRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const subjectTeachers = await prisma.subjectTeacher.findMany({
        where: { teacher: { timetableId } },
      });
      return { subjectTeachers };
    }),
  add: editorProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        teacherId: zodIdSchema,
        subjectId: zodIdSchema,
        timetableId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, teacherId, subjectId, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const subjectTeacher = await prisma.subjectTeacher.create({
        data: { id, teacherId, subjectId },
      });
      return { subjectTeacher };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema, timetableId: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const subjectTeacher = await prisma.subjectTeacher.delete({
        where: { id },
      });
      return { subjectTeacher };
    }),
} satisfies TRPCRouterRecord;
