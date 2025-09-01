import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const teacherUnavailabilitiesRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;
      const teachers = await prisma.teacher.findMany({
        where: { timetableId },
      });
      const teacherUnavailables = await prisma.teacherUnavailable.findMany({
        where: { teacherId: { in: teachers.map((teacher) => teacher.id) } },
      });
      return { teacherUnavailables };
    }),
  add: authedProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        slotId: zodIdSchema,
        teacherId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, slotId, teacherId } = input;
      const teacherUnavailable = await prisma.teacherUnavailable.create({
        data: { id, slotId, teacherId },
      });
      return { teacherUnavailable };
    }),
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const teacherUnavailable = await prisma.teacherUnavailable.delete({
        where: { id },
      });
      return { teacherUnavailable };
    }),
} satisfies TRPCRouterRecord;
