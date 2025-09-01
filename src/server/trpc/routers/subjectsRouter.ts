import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const subjectsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;
      const subjects = await prisma.subject.findMany({
        where: { group: { timetableId } },
      });
      return { subjects };
    }),
  add: authedProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        timetableId: zodIdSchema,
        name: z.string(),
        groupId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId, name, groupId } = input;

      // To confirm if group is part of timetable.
      const group = await prisma.group.findUniqueOrThrow({
        where: { id: groupId, timetableId },
      });

      const subject = await prisma.subject.create({
        data: {
          id,
          name,
          groupId: group.id,
        },
      });
      return { subject };
    }),
  update: authedProcedure
    .input(
      z.object({
        id: zodIdSchema,
        name: z.string(),
        groupId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, name, groupId } = input;
      const subject = await prisma.subject.update({
        where: { id },
        data: {
          name,
          groupId,
        },
      });
      return { subject };
    }),
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const subject = await prisma.subject.delete({
        where: { id },
      });
      return { subject };
    }),
} satisfies TRPCRouterRecord;
