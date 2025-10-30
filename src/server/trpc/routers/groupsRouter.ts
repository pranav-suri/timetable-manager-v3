import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import {
  verifyTimetableOwnership,
  verifyEntityOwnership,
} from "../utils/verifyTimetableOwnership";

export const groupsRouter = {
  list: authedProcedure
    .input(
      z.object({
        timetableId: zodIdSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      await verifyTimetableOwnership(ctx, timetableId);

      const groups = await prisma.group.findMany({
        where: { timetableId },
      });
      return { groups };
    }),
  add: editorProcedure
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

      await verifyTimetableOwnership(ctx, timetableId);

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
  update: editorProcedure
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

      await verifyEntityOwnership(ctx, id, "group");
      await verifyTimetableOwnership(ctx, timetableId);

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
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;

      await verifyEntityOwnership(ctx, id, "group");

      const group = await prisma.group.delete({
        where: { id },
      });
      return { group };
    }),
} satisfies TRPCRouterRecord;
