import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const lecturesRouter = {
  list: authedProcedure
    .input(
      z.object({
        timetableID: zodIdSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableID } = input;
      const lectures = await prisma.lecture.findMany({
        where: {
          timetableId: timetableID,
        },
        include: {
          lectureClassrooms: true,
          lectureSlots: true,
          lectureSubdivisions: true,
        },
      });
      return { lectures };
    }),
  add: authedProcedure
    .input(
      z.object({
        teacherId: zodIdSchema,
        subjectId: zodIdSchema,
        timetableId: zodIdSchema,
        slotIds: z.optional(z.array(zodIdSchema)),
        classroomIds: z.optional(z.array(zodIdSchema)),
        subdivisionIds: z.optional(z.array(zodIdSchema)),
        count: z.number().min(1).default(1),
        duration: z.number().min(1).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const {
        teacherId,
        subjectId,
        count,
        duration,
        timetableId,
        classroomIds,
        slotIds,
        subdivisionIds,
      } = input;

      const lecture = await prisma.lecture.create({
        data: { teacherId, subjectId, count, timetableId, duration },
      });

      if (classroomIds?.length) {
        await prisma.lectureClassroom.createMany({
          data: classroomIds.map((classroomId) => ({
            lectureId: lecture.id,
            classroomId,
          })),
        });
      }

      if (slotIds?.length) {
        await prisma.lectureSlot.createMany({
          data: slotIds.map((slotId) => ({
            lectureId: lecture.id,
            slotId,
          })),
        });
      }

      if (subdivisionIds?.length) {
        await prisma.lectureSubdivision.createMany({
          data: subdivisionIds.map((subdivisionId) => ({
            lectureId: lecture.id,
            subdivisionId,
          })),
        });
      }

      return { lecture };
    }),
  update: authedProcedure
    .input(
      z.object({
        id: zodIdSchema,
        teacherId: zodIdSchema,
        subjectId: zodIdSchema,
        slotId: zodIdSchema,
        classroomIds: z.array(zodIdSchema),
        subdivisionIds: z.array(zodIdSchema),
        slotIds: z.array(zodIdSchema),
        count: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const {
        id,
        teacherId,
        subjectId,
        count,
        classroomIds,
        slotIds,
        subdivisionIds,
      } = input;

      const lecture = await prisma.lecture.update({
        where: { id },
        data: { teacherId, subjectId, count },
      });

      await prisma.lectureSlot.deleteMany({
        where: { lectureId: id, slotId: { not: { in: slotIds } } },
      });

      for (const slotId of slotIds) {
        await prisma.lectureSlot.upsert({
          where: {
            lectureId_slotId: { lectureId: id, slotId },
          },
          update: {},
          create: { lectureId: id, slotId },
        });
      }

      await prisma.lectureClassroom.deleteMany({
        where: {
          lectureId: id,
          classroomId: { not: { in: classroomIds } },
        },
      });
      for (const classroomId of classroomIds) {
        await prisma.lectureClassroom.upsert({
          where: {
            lectureId_classroomId: { lectureId: id, classroomId },
          },
          update: {},
          create: { lectureId: id, classroomId },
        });
      }

      await prisma.lectureSubdivision.deleteMany({
        where: {
          lectureId: id,
          subdivisionId: { not: { in: subdivisionIds } },
        },
      });
      for (const subdivisionId of subdivisionIds) {
        await prisma.lectureSubdivision.upsert({
          where: {
            lectureId_subdivisionId: { lectureId: id, subdivisionId },
          },
          update: {},
          create: { lectureId: id, subdivisionId },
        });
      }

      return { lecture };
    }),
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const lecture = await prisma.lecture.delete({ where: { id } });
      return { lecture };
    }),
} satisfies TRPCRouterRecord;
