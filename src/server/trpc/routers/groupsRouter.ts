import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const groupsRouter = {
  list: authedProcedure
    .input(
      z.object({
        timetableId: zodIdSchema,
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
        id: zodIdSchema.optional(),
        timetableId: zodIdSchema,
        name: z.string(),
        allowSimultaneous: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId, name, allowSimultaneous } = input;

      const group = await prisma.group.create({
        data: {
          id,
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
        id: zodIdSchema,
        timetableId: zodIdSchema,
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
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const group = await prisma.group.delete({
        where: { id },
      });
      return { group };
    }),
} satisfies TRPCRouterRecord;
