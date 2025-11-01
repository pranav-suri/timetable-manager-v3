import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import { verifyTimetableOwnership } from "../utils/verifyTimetableOwnership";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const teacherUnavailabilitiesRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const teachers = await prisma.teacher.findMany({
        where: { timetableId },
      });
      const teacherUnavailables = await prisma.teacherUnavailable.findMany({
        where: { teacherId: { in: teachers.map((teacher) => teacher.id) } },
      });
      return { teacherUnavailables };
    }),
  add: editorProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        slotId: zodIdSchema,
        teacherId: zodIdSchema,
        timetableId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, slotId, teacherId, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const teacherUnavailable = await prisma.teacherUnavailable.create({
        data: { id, slotId, teacherId },
      });
      return { teacherUnavailable };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema, timetableId: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const teacherUnavailable = await prisma.teacherUnavailable.delete({
        where: { id },
      });
      return { teacherUnavailable };
    }),
} satisfies TRPCRouterRecord;
