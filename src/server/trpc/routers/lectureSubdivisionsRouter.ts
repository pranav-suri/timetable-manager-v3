import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const lectureSubdivisionsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;
      const lectureSubdivisions = await prisma.lectureSubdivision.findMany({
        where: { lecture: { timetableId } },
      });
      return { lectureSubdivisions };
    }),
  add: authedProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        subdivisionId: zodIdSchema,
        lectureId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { subdivisionId, lectureId, id } = input;
      const lectureSubdivision = await prisma.lectureSubdivision.create({
        data: { id, subdivisionId, lectureId },
      });
      return { lectureSubdivision };
    }),
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const lectureSubdivision = await prisma.lectureSubdivision.delete({
        where: { id },
      });
      return { lectureSubdivision };
    }),
} satisfies TRPCRouterRecord;
