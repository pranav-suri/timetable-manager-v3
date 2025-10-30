// tRPC router for SubdivisionUnavailable constraints
// Exposes API procedures for managing subdivision availability

import { z } from "zod";
import { authedProcedure } from "../../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const subdivisionUnavailableRouter = {
  // List all subdivision unavailabilities for a timetable
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      const subdivisionUnavailables =
        await prisma.subdivisionUnavailable.findMany({
          where: { subdivision: { timetableId } },
          include: {
            subdivision: true,
            slot: true,
          },
        });

      return { subdivisionUnavailables };
    }),

  // Add subdivision unavailability
  add: authedProcedure
    .input(
      z.object({
        subdivisionId: zodIdSchema,
        slotId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { subdivisionId, slotId } = input;

      const subdivisionUnavailable = await prisma.subdivisionUnavailable.create(
        {
          data: {
            subdivisionId,
            slotId,
          },
          include: {
            subdivision: true,
            slot: true,
          },
        },
      );

      return { subdivisionUnavailable };
    }),

  // Delete subdivision unavailability
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;

      await prisma.subdivisionUnavailable.delete({
        where: { id },
      });

      return { success: true };
    }),

  // Bulk add subdivision unavailabilities
  bulkAdd: authedProcedure
    .input(
      z.object({
        subdivisionId: zodIdSchema,
        slotIds: z.array(zodIdSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { subdivisionId, slotIds } = input;

      const data = slotIds.map((slotId) => ({
        subdivisionId,
        slotId,
      }));

      await prisma.subdivisionUnavailable.createMany({
        data,
      });

      return { success: true, count: data.length };
    }),

  // Bulk delete subdivision unavailabilities
  bulkDelete: authedProcedure
    .input(
      z.object({
        subdivisionId: zodIdSchema,
        slotIds: z.array(zodIdSchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { subdivisionId, slotIds } = input;

      const result = await prisma.subdivisionUnavailable.deleteMany({
        where: {
          subdivisionId,
          ...(slotIds && { slotId: { in: slotIds } }),
        },
      });

      return { success: true, count: result.count };
    }),
} satisfies TRPCRouterRecord;
