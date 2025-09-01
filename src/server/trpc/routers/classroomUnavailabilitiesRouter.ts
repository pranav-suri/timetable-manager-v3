import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const classroomUnavailabilitiesRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;
      const classrooms = await prisma.classroom.findMany({
        where: { timetableId },
      });
      const classroomUnavailables = await prisma.classroomUnavailable.findMany({
        where: { classroomId: { in: classrooms.map((classroom) => classroom.id) } },
      });
      return { classroomUnavailables };
    }),
  add: authedProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        slotId: zodIdSchema,
        classroomId: zodIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, slotId, classroomId } = input;
      const classroomUnavailable = await prisma.classroomUnavailable.create({
        data: { id, slotId, classroomId },
      });
      return { classroomUnavailable };
    }),
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const classroomUnavailable = await prisma.classroomUnavailable.delete({
        where: { id },
      });
      return { classroomUnavailable };
    }),
} satisfies TRPCRouterRecord;
