import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const lecturesRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;
      const lectures = await prisma.lecture.findMany({
        where: { timetableId },
      });
      return { lectures };
    }),
  add: authedProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        teacherId: zodIdSchema,
        subjectId: zodIdSchema,
        timetableId: zodIdSchema,
        count: z.number(),
        duration: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, teacherId, subjectId, timetableId, count, duration } = input;
      const lecture = await prisma.lecture.create({
        data: { id, teacherId, subjectId, timetableId, count, duration },
      });
      return { lecture };
    }),
  update: authedProcedure
    .input(
      z.object({
        id: zodIdSchema,
        teacherId: zodIdSchema.optional(),
        subjectId: zodIdSchema.optional(),
        count: z.number().optional(),
        duration: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, ...data } = input;
      const lecture = await prisma.lecture.update({
        where: { id },
        data,
      });
      return { lecture };
    }),
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const lecture = await prisma.lecture.delete({ where: { id } });
      return { lecture };
    }),
} satisfies TRPCRouterRecord;
