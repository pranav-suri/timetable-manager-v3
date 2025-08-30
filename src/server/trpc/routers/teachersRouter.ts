import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";

export const teachersRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      const teachers = await prisma.teacher.findMany({
        where: { timetableId },
      });
      return { teachers };
    }),

  add: authedProcedure
    .input(
      z.object({
        timetableId: z.number(),
        name: z.string(),
        email: z.email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId, name, email } = input;

      const teacher = await prisma.teacher.create({
        data: {
          timetableId,
          name,
          email,
        },
      });
      return { teacher };
    }),
  update: authedProcedure
    .input(
      z.object({
        id: z.number(),
        timetableId: z.number(),
        name: z.string(),
        email: z.email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId, name, email } = input;
      const teacher = await prisma.teacher.update({
        where: { id },
        data: {
          timetableId,
          name,
          email,
        },
      });
      return { teacher };
    }),
  delete: authedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const teacher = await prisma.teacher.delete({
        where: { id },
      });
      return { teacher };
    }),
} satisfies TRPCRouterRecord;
