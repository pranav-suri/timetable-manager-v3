import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import {
  verifyTimetableOwnership,
  verifyEntityOwnership,
} from "../utils/verifyTimetableOwnership";

export const subdivisionsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      await verifyTimetableOwnership(ctx, timetableId);

      const subdivisions = await prisma.subdivision.findMany({
        where: { timetableId },
      });
      return { subdivisions };
    }),
  add: editorProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        timetableId: zodIdSchema,
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId, name } = input;

      await verifyTimetableOwnership(ctx, timetableId);

      const subdivision = await prisma.subdivision.create({
        data: {
          id,
          timetableId,
          name,
        },
      });
      return { subdivision };
    }),
  update: editorProcedure
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

      await verifyEntityOwnership(ctx, id, "subdivision");
      await verifyTimetableOwnership(ctx, timetableId);

      const subdivision = await prisma.subdivision.update({
        where: { id },
        data: {
          timetableId,
          name,
        },
      });
      return { subdivision };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;

      await verifyEntityOwnership(ctx, id, "subdivision");

      const subdivision = await prisma.subdivision.delete({
        where: { id },
      });
      return { subdivision };
    }),
} satisfies TRPCRouterRecord;
