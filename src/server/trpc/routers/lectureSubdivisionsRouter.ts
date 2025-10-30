import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import { verifyTimetableOwnership } from "../utils/verifyTimetableOwnership";

export const lectureSubdivisionsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const lectureSubdivisions = await prisma.lectureSubdivision.findMany({
        where: { lecture: { timetableId } },
      });
      return { lectureSubdivisions };
    }),
  add: editorProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        subdivisionId: zodIdSchema,
        lectureId: zodIdSchema,
        timetableId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { subdivisionId, lectureId, id, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const lectureSubdivision = await prisma.lectureSubdivision.create({
        data: { id, subdivisionId, lectureId },
      });
      return { lectureSubdivision };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema, timetableId: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const lectureSubdivision = await prisma.lectureSubdivision.delete({
        where: { id },
      });
      return { lectureSubdivision };
    }),
} satisfies TRPCRouterRecord;
