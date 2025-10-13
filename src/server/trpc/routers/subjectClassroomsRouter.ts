import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import { verifyTimetableOwnership } from "../utils/verifyTimetableOwnership";

export const subjectClassroomsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const subjectClassrooms = await prisma.subjectClassroom.findMany({
        where: { classroom: { timetableId } },
      });
      return { subjectClassrooms };
    }),
  add: editorProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        classroomId: zodIdSchema,
        subjectId: zodIdSchema,
        timetableId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, classroomId, subjectId, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const subjectClassroom = await prisma.subjectClassroom.create({
        data: { id, classroomId, subjectId },
      });
      return { subjectClassroom };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema, timetableId: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const subjectClassroom = await prisma.subjectClassroom.delete({
        where: { id },
      });
      return { subjectClassroom };
    }),
} satisfies TRPCRouterRecord;
