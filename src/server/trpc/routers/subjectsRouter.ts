import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";

export const subjectsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      const groups = await prisma.group.findMany({
        where: { timetableId },
      });
      const subjects = await prisma.subject.findMany({
        where: { groupId: { in: groups.map((group) => group.id) } },
      });
      return { subjects };
    }),
  add: authedProcedure
    .input(
      z.object({
        timetableId: z.number(),
        name: z.string(),
        duration: z.number(),
        groupId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId, name, duration, groupId } = input;

      const group = await prisma.group.findUniqueOrThrow({
        where: { id: groupId, timetableId },
      });
      const subject = await prisma.subject.create({
        data: {
          name,
          duration,
          groupId: group.id,
        },
      });
      return { subject };
    }),
  update: authedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        duration: z.number(),
        groupId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, name, duration, groupId } = input;
      const subject = await prisma.subject.update({
        where: { id },
        data: {
          name,
          duration,
          groupId,
        },
      });
      return { subject };
    }),
  delete: authedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const subject = await prisma.subject.delete({
        where: { id },
      });
      return { subject };
    }),
} satisfies TRPCRouterRecord;
