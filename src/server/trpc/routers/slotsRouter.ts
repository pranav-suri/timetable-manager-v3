import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import { verifyTimetableOwnership, verifyEntityOwnership } from "../utils/verifyTimetableOwnership";

export const slotsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;
      
      await verifyTimetableOwnership(ctx, timetableId);
      
      const slots = await prisma.slot.findMany({ where: { timetableId } });
      return { slots };
    }),
  add: editorProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        timetableId: zodIdSchema,
        day: z.number(),
        number: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId, day, number } = input;
      
      await verifyTimetableOwnership(ctx, timetableId);
      
      const slot = await prisma.slot.create({
        data: { id, timetableId, day, number },
      });
      return { slot };
    }),
  update: editorProcedure
    .input(
      z.object({
        id: zodIdSchema,
        timetableId: zodIdSchema,
        day: z.number(),
        number: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId, day, number } = input;
      
      await verifyEntityOwnership(ctx, id, 'slot');
      await verifyTimetableOwnership(ctx, timetableId);
      
      const slot = await prisma.slot.update({
        where: { id },
        data: { timetableId, day, number },
      });
      return { slot };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      
      await verifyEntityOwnership(ctx, id, 'slot');
      
      const slot = await prisma.slot.delete({ where: { id } });
      return { slot };
    }),
} satisfies TRPCRouterRecord;
