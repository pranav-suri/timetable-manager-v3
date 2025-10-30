import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import {
  verifyTimetableOwnership,
  verifyEntityOwnership,
} from "../utils/verifyTimetableOwnership";

export const classroomsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      await verifyTimetableOwnership(ctx, timetableId);

      const classrooms = await prisma.classroom.findMany({
        where: { timetableId },
      });
      return { classrooms };
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

      const classroom = await prisma.classroom.create({
        data: { id, timetableId, name },
      });
      return { classroom };
    }),
  update: editorProcedure
    .input(
      z.object({ id: zodIdSchema, timetableId: zodIdSchema, name: z.string() }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId, name } = input;

      await verifyEntityOwnership(ctx, id, "classroom");
      await verifyTimetableOwnership(ctx, timetableId);

      const classroom = await prisma.classroom.update({
        where: { id },
        data: { timetableId, name },
      });
      return { classroom };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;

      await verifyEntityOwnership(ctx, id, "classroom");

      const classroom = await prisma.classroom.delete({ where: { id } });
      return { classroom };
    }),
} satisfies TRPCRouterRecord;
