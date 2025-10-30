import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const autoLecturesRouter = {
  add: authedProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        teacherId: zodIdSchema,
        subjectId: zodIdSchema,
        timetableId: zodIdSchema,
        classroomIds: z.optional(z.array(zodIdSchema)),
        subdivisionIds: z.optional(z.array(zodIdSchema)),
        count: z.number().min(0).default(1),
        duration: z.number().min(1).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const {
        id,
        teacherId,
        subjectId,
        count,
        duration,
        timetableId,
        classroomIds,
        subdivisionIds,
      } = input;
      const lecture = await prisma.lecture.create({
        data: { id, teacherId, subjectId, count, timetableId, duration },
      });

      if (classroomIds?.length) {
        await prisma.lectureClassroom.createMany({
          data: classroomIds.map((classroomId) => ({
            lectureId: lecture.id,
            classroomId,
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
        duration: z.number(),
        classroomIds: z.array(zodIdSchema),
        subdivisionIds: z.array(zodIdSchema),
        count: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, teacherId, subjectId, count, classroomIds, subdivisionIds, duration } =
        input;

      const lecture = await prisma.lecture.update({
        where: { id },
        data: { teacherId, subjectId, count, duration },
      });

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
} satisfies TRPCRouterRecord;
