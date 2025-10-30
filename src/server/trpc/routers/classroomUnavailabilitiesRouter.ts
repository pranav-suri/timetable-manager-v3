import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import { verifyTimetableOwnership } from "../utils/verifyTimetableOwnership";

export const classroomUnavailabilitiesRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const classrooms = await prisma.classroom.findMany({
        where: { timetableId },
      });
      const classroomUnavailables = await prisma.classroomUnavailable.findMany({
        where: {
          classroomId: { in: classrooms.map((classroom) => classroom.id) },
        },
      });
      return { classroomUnavailables };
    }),
  add: editorProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        slotId: zodIdSchema,
        classroomId: zodIdSchema,
        timetableId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, slotId, classroomId, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const classroomUnavailable = await prisma.classroomUnavailable.create({
        data: { id, slotId, classroomId },
      });
      return { classroomUnavailable };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema, timetableId: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const classroomUnavailable = await prisma.classroomUnavailable.delete({
        where: { id },
      });
      return { classroomUnavailable };
    }),
} satisfies TRPCRouterRecord;
