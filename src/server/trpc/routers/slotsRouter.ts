import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";

export const slotsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;
      const slots = await prisma.slot.findMany({ where: { timetableId } });
      return { slots };
    }),
  add: authedProcedure
    .input(
      z.object({
        timetableId: z.number(),
        day: z.number(),
        number: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId, day, number } = input;
      const slot = await prisma.slot.create({
        data: { timetableId, day, number },
      });
      return { slot };
    }),
  update: authedProcedure
    .input(
      z.object({
        id: z.number(),
        timetableId: z.number(),
        day: z.number(),
        number: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId, day, number } = input;
      const slot = await prisma.slot.update({
        where: { id },
        data: { timetableId, day, number },
      });
      return { slot };
    }),
  delete: authedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const slot = await prisma.slot.delete({ where: { id } });
      return { slot };
    }),
} satisfies TRPCRouterRecord;
