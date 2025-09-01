import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const subdivisionUnavailabilitiesRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;
      const subdivisions = await prisma.subdivision.findMany({
        where: { timetableId },
      });
      const subdivisionUnavailables = await prisma.subdivisionUnavailable.findMany({
        where: { subdivisionId: { in: subdivisions.map((subdivision) => subdivision.id) } },
      });
      return { subdivisionUnavailables };
    }),
  add: authedProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        slotId: zodIdSchema,
        subdivisionId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, slotId, subdivisionId } = input;
      const subdivisionUnavailable = await prisma.subdivisionUnavailable.create({
        data: { id, slotId, subdivisionId },
      });
      return { subdivisionUnavailable };
    }),
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const subdivisionUnavailable = await prisma.subdivisionUnavailable.delete({
        where: { id },
      });
      return { subdivisionUnavailable };
    }),
} satisfies TRPCRouterRecord;
