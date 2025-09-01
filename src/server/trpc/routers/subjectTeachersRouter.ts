import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const subjectTeachersRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;
      const subjectTeachers = await prisma.subjectTeacher.findMany({
        where: { teacher: { timetableId } },
      });
      return { subjectTeachers };
    }),
  add: authedProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        teacherId: zodIdSchema,
        subjectId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, teacherId, subjectId } = input;
      const subjectTeacher = await prisma.subjectTeacher.create({
        data: { id, teacherId, subjectId },
      });
      return { subjectTeacher };
    }),
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const subjectTeacher = await prisma.subjectTeacher.delete({
        where: { id },
      });
      return { subjectTeacher };
    }),
} satisfies TRPCRouterRecord;
