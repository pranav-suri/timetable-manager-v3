import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const lectureClassroomsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;
      const lectures = await prisma.lecture.findMany({
        where: { timetableId },
      });
      const lectureClassrooms = await prisma.lectureClassroom.findMany({
        where: { lectureId: { in: lectures.map((lecture) => lecture.id) } },
      });
      return { lectureClassrooms };
    }),
  add: authedProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        classroomId: zodIdSchema,
        lectureId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, classroomId, lectureId } = input;
      const lectureClassroom = await prisma.lectureClassroom.create({
        data: { id, classroomId, lectureId },
      });
      return { lectureClassroom };
    }),
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const lectureClassroom = await prisma.lectureClassroom.delete({
        where: { id },
      });
      return { lectureClassroom };
    }),
} satisfies TRPCRouterRecord;
