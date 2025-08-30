import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";

export const subdivisionsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      const subdivisions = await prisma.subdivision.findMany({
        where: { timetableId },
      });
      return { subdivisions };
    }),
  add: authedProcedure
    .input(z.object({ timetableId: z.number(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId, name } = input;

      const subdivision = await prisma.subdivision.create({
        data: {
          timetableId,
          name,
        },
      });
      return { subdivision };
    }),
} satisfies TRPCRouterRecord;
