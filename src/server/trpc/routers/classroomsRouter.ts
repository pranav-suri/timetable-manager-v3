import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";

export const classroomsRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;
      const classrooms = await prisma.classroom.findMany({
        where: { timetableId },
      });
      return { classrooms };
    }),
  add: authedProcedure
    .input(z.object({ timetableId: z.number(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId, name } = input;
      const classroom = await prisma.classroom.create({
        data: { timetableId, name },
      });
      return { classroom };
    }),
  update: authedProcedure
    .input(
      z.object({ id: z.number(), timetableId: z.number(), name: z.string() }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, timetableId, name } = input;
      const classroom = await prisma.classroom.update({
        where: { id },
        data: { timetableId, name },
      });
      return { classroom };
    }),
  delete: authedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const classroom = await prisma.classroom.delete({ where: { id } });
      return { classroom };
    }),
} satisfies TRPCRouterRecord;
