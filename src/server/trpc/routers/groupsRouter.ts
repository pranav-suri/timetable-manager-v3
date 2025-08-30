import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";

export const groupsRouter = {
  list: authedProcedure
    .input(
      z.object({
        timetableId: z.number(),
        allowSimultaneous: z.boolean(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      const groups = await prisma.group.findMany({
        where: { timetableId },
      });
      return { groups };
    }),
  add: authedProcedure
    .input(
      z.object({
        timetableId: z.number(),
        name: z.string(),
        allowSimultaneous: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId, name, allowSimultaneous } = input;

      const group = await prisma.group.create({
        data: {
          timetableId,
          name,
          allowSimultaneous,
        },
      });
      return { group };
    }),
  update: authedProcedure
    .input(
      z.object({
        id: z.number(),
        timetableId: z.number(),
        name: z.string(),
        allowSimultaneous: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId, name, allowSimultaneous } = input;
      const group = await prisma.group.update({
        where: { id },
        data: {
          timetableId,
          name,
          allowSimultaneous,
        },
      });
      return { group };
    }),
  delete: authedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const group = await prisma.group.delete({
        where: { id },
      });
      return { group };
    }),
} satisfies TRPCRouterRecord;
