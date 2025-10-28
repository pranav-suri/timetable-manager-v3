import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import { verifyTimetableOwnership, verifyEntityOwnership } from "../utils/verifyTimetableOwnership";

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

  add: editorProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        timetableId: zodIdSchema,
        name: z.string(),
        email: z.email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId, name, email, id } = input;

      // Verify timetable belongs to user's organization
      await verifyTimetableOwnership(ctx, timetableId);

      const teacher = await prisma.teacher.create({
        data: {
          id,
          timetableId,
          name,
          email,
        },
      });
      return { teacher };
    }),
  update: editorProcedure
    .input(
      z.object({
        id: zodIdSchema,
        name: z.string(),
        email: z.email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, name, email } = input;
      
      // Verify teacher belongs to user's organization
      await verifyEntityOwnership(ctx, id, 'teacher');
      
      const teacher = await prisma.teacher.update({
        where: { id },
        data: {
          name,
          email,
        },
      });
      return { teacher };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      
      // Verify teacher belongs to user's organization
      await verifyEntityOwnership(ctx, id, 'teacher');
      
      const teacher = await prisma.teacher.delete({
        where: { id },
      });
      return { teacher };
    }),
} satisfies TRPCRouterRecord;
