import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import {
  verifyTimetableOwnership,
  verifyEntityOwnership,
} from "../utils/verifyTimetableOwnership";

export const lecturesRouter = {
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
      return { lectures };
    }),
  add: editorProcedure
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

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const lecture = await prisma.lecture.create({
        data: { id, teacherId, subjectId, timetableId, count, duration },
      });
      return { lecture };
    }),
  update: editorProcedure
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

      // Verify entity ownership
      await verifyEntityOwnership(ctx, id, "lecture");

      const lecture = await prisma.lecture.update({
        where: { id },
        data,
      });
      return { lecture };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;

      // Verify entity ownership
      await verifyEntityOwnership(ctx, id, "lecture");

      const lecture = await prisma.lecture.delete({ where: { id } });
      return { lecture };
    }),
} satisfies TRPCRouterRecord;
