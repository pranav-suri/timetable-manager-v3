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
        email: z.string().email(),
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
} satisfies TRPCRouterRecord;
