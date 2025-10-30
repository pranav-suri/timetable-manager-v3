// tRPC router for TeacherUnavailable constraints
// Exposes API procedures for managing teacher availability

import { z } from "zod";
import { authedProcedure } from "../../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const teacherUnavailableRouter = {
  // List all teacher unavailabilities for a timetable
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      const teacherUnavailables = await prisma.teacherUnavailable.findMany({
        where: { teacher: { timetableId } },
        include: {
          teacher: true,
          slot: true,
        },
      });

      return { teacherUnavailables };
    }),

  // Add teacher unavailability
  add: authedProcedure
    .input(
      z.object({
        teacherId: zodIdSchema,
        slotId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { teacherId, slotId } = input;

      const teacherUnavailable = await prisma.teacherUnavailable.create({
        data: {
          teacherId,
          slotId,
        },
        include: {
          teacher: true,
          slot: true,
        },
      });

      return { teacherUnavailable };
    }),

  // Delete teacher unavailability
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;

      await prisma.teacherUnavailable.delete({
        where: { id },
      });

      return { success: true };
    }),

  // Bulk add teacher unavailabilities
  bulkAdd: authedProcedure
    .input(
      z.object({
        teacherId: zodIdSchema,
        slotIds: z.array(zodIdSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { teacherId, slotIds } = input;

      const data = slotIds.map((slotId) => ({
        teacherId,
        slotId,
      }));

      await prisma.teacherUnavailable.createMany({
        data,
      });

      return { success: true, count: data.length };
    }),

  // Bulk delete teacher unavailabilities
  bulkDelete: authedProcedure
    .input(
      z.object({
        teacherId: zodIdSchema,
        slotIds: z.array(zodIdSchema).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { teacherId, slotIds } = input;

      const result = await prisma.teacherUnavailable.deleteMany({
        where: {
          teacherId,
          ...(slotIds && { slotId: { in: slotIds } }),
        },
      });

      return { success: true, count: result.count };
    }),
} satisfies TRPCRouterRecord;
