import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

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
      const lectureSlots = await prisma.lectureSlot.findMany({
        where: {
          slot: { timetableId },
        },
      });
      return { lectureSlots };
    }),
  add: authedProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        slotId: zodIdSchema,
        lectureId: zodIdSchema,
        isLocked: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, slotId, lectureId, isLocked } = input;
      const lectureSlot = await prisma.lectureSlot.create({
        data: { id, slotId, lectureId, isLocked },
      });
      return { lectureSlot };
    }),
  update: authedProcedure
    .input(
      z.object({
        id: zodIdSchema,
        slotId: zodIdSchema,
        lectureId: zodIdSchema,
        isLocked: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, slotId, lectureId, isLocked } = input;
      const lectureSlot = await prisma.lectureSlot.update({
        where: { id },
        data: { slotId, lectureId, isLocked },
      });
      return { lectureSlot };
    }),
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const lectureSlot = await prisma.lectureSlot.delete({ where: { id } });
      return { lectureSlot };
    }),
} satisfies TRPCRouterRecord;
