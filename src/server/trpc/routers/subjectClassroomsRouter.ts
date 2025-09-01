import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const subjectClassroomsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;
      const subjectClassrooms = await prisma.subjectClassroom.findMany({
        where: { classroom: { timetableId } },
      });
      return { subjectClassrooms };
    }),
  add: authedProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        classroomId: zodIdSchema,
        subjectId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, classroomId, subjectId } = input;
      const subjectClassroom = await prisma.subjectClassroom.create({
        data: { id, classroomId, subjectId },
      });
      return { subjectClassroom };
    }),
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const subjectClassroom = await prisma.subjectClassroom.delete({
        where: { id },
      });
      return { subjectClassroom };
    }),
} satisfies TRPCRouterRecord;
