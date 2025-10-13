import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import { verifyTimetableOwnership } from "../utils/verifyTimetableOwnership";

export const lectureSlotsRouter = {
  list: authedProcedure
    .input(
      z.object({
        timetableId: zodIdSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const lectureSlots = await prisma.lectureSlot.findMany({
        where: {
          slot: { timetableId },
        },
      });
      return { lectureSlots };
    }),
  add: editorProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        slotId: zodIdSchema,
        lectureId: zodIdSchema,
        isLocked: z.boolean().optional(),
        timetableId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, slotId, lectureId, isLocked, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const lectureSlot = await prisma.lectureSlot.create({
        data: { id, slotId, lectureId, isLocked },
      });
      return { lectureSlot };
    }),
  update: editorProcedure
    .input(
      z.object({
        id: zodIdSchema,
        slotId: zodIdSchema,
        lectureId: zodIdSchema,
        isLocked: z.boolean(),
        timetableId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, slotId, lectureId, isLocked, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const lectureSlot = await prisma.lectureSlot.update({
        where: { id },
        data: { slotId, lectureId, isLocked },
      });
      return { lectureSlot };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema, timetableId: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId } = input;

      // Verify timetable ownership
      await verifyTimetableOwnership(ctx, timetableId);

      const lectureSlot = await prisma.lectureSlot.delete({ where: { id } });
      return { lectureSlot };
    }),
} satisfies TRPCRouterRecord;
