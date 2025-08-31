import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const subdivisionsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      const subdivisions = await prisma.subdivision.findMany({
        where: { timetableId },
      });
      return { subdivisions };
    }),
  add: authedProcedure
    .input(z.object({ timetableId: zodIdSchema, name: z.string() }))
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
  update: authedProcedure
    .input(
      z.object({
        id: zodIdSchema,
        timetableId: zodIdSchema,
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId, name } = input;
      const subdivision = await prisma.subdivision.update({
        where: { id },
        data: {
          timetableId,
          name,
        },
      });
      return { subdivision };
    }),
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const subdivision = await prisma.subdivision.delete({
        where: { id },
      });
      return { subdivision };
    }),
} satisfies TRPCRouterRecord;
