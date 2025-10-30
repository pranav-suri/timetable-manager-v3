import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import { verifyTimetableOwnership } from "../utils/verifyTimetableOwnership";

export const subdivisionUnavailabilitiesRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const subdivisions = await prisma.subdivision.findMany({
        where: { timetableId },
      });
      const subdivisionUnavailables =
        await prisma.subdivisionUnavailable.findMany({
          where: {
            subdivisionId: {
              in: subdivisions.map((subdivision) => subdivision.id),
            },
          },
        });
      return { subdivisionUnavailables };
    }),
  add: editorProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        slotId: zodIdSchema,
        subdivisionId: zodIdSchema,
        timetableId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, slotId, subdivisionId, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const subdivisionUnavailable = await prisma.subdivisionUnavailable.create(
        {
          data: { id, slotId, subdivisionId },
        },
      );
      return { subdivisionUnavailable };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema, timetableId: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const subdivisionUnavailable = await prisma.subdivisionUnavailable.delete(
        {
          where: { id },
        },
      );
      return { subdivisionUnavailable };
    }),
} satisfies TRPCRouterRecord;
