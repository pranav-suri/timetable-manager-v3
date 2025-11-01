import { z } from "zod";
import { TeacherSchema } from "generated/zod";
import { authedProcedure, editorProcedure } from "../init";
import {
  verifyEntityOwnership,
  verifyTimetableOwnership,
} from "../utils/verifyTimetableOwnership";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const teachersRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      // Verify timetable belongs to user's organization
      await verifyTimetableOwnership(ctx, timetableId);

      const teachers = await prisma.teacher.findMany({
        where: { timetableId },
      });
      return { teachers };
    }),

  add: editorProcedure.input(TeacherSchema).mutation(async ({ ctx, input }) => {
    const { prisma } = ctx;
    const { timetableId, ...rest } = input;

    // Verify timetable belongs to user's organization
    await verifyTimetableOwnership(ctx, timetableId);

    const teacher = await prisma.teacher.create({
      data: {
        timetableId,
        ...rest,
      },
    });
    return { teacher };
  }),
  update: editorProcedure
    .input(TeacherSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const { id, timetableId, ...rest } = input;

      // Verify teacher belongs to user's organization
      await verifyEntityOwnership(ctx, id, "teacher");

      const teacher = await prisma.teacher.update({
        where: { id },
        data: { ...rest },
      });
      return { teacher };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;

      // Verify teacher belongs to user's organization
      await verifyEntityOwnership(ctx, id, "teacher");

      const teacher = await prisma.teacher.delete({
        where: { id },
      });
      return { teacher };
    }),
} satisfies TRPCRouterRecord;
