// tRPC router for ClassroomUnavailable constraints
// Exposes API procedures for managing classroom availability

import { z } from "zod";
import { authedProcedure } from "../../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const classroomUnavailableRouter = {
  // List all classroom unavailabilities for a timetable
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      const classroomUnavailables = await prisma.classroomUnavailable.findMany({
        where: { classroom: { timetableId } },
        include: {
          classroom: true,
          slot: true,
        },
      });

      return { classroomUnavailables };
    }),

  // Add classroom unavailability
  add: authedProcedure
    .input(
      z.object({
        classroomId: zodIdSchema,
        slotId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { classroomId, slotId } = input;

      const classroomUnavailable = await prisma.classroomUnavailable.create({
        data: {
          classroomId,
          slotId,
        },
        include: {
          classroom: true,
          slot: true,
        },
      });

      return { classroomUnavailable };
    }),

  // Delete classroom unavailability
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;

      await prisma.classroomUnavailable.delete({
        where: { id },
      });

      return { success: true };
    }),

  // Bulk add classroom unavailabilities
  bulkAdd: authedProcedure
    .input(
      z.object({
        classroomId: zodIdSchema,
        slotIds: z.array(zodIdSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { classroomId, slotIds } = input;

      const data = slotIds.map((slotId) => ({
        classroomId,
        slotId,
      }));

      await prisma.classroomUnavailable.createMany({
        data,
      });

      return { success: true, count: data.length };
    }),

  // Bulk delete classroom unavailabilities
  bulkDelete: authedProcedure
    .input(
      z.object({
        classroomId: zodIdSchema,
        slotIds: z.array(zodIdSchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { classroomId, slotIds } = input;

      const result = await prisma.classroomUnavailable.deleteMany({
        where: {
          classroomId,
          ...(slotIds && { slotId: { in: slotIds } }),
        },
      });

      return { success: true, count: result.count };
    }),
} satisfies TRPCRouterRecord;
