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
        slotIds: z.optional(z.array(zodIdSchema)),
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
        slotIds,
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

      if (slotIds?.length) {
        await prisma.lectureSlot.createMany({
          data: slotIds.map((slotId) => ({
            lectureId: lecture.id,
            slotId,
          })),
        });
      }

      return { lecture };
    }),
} satisfies TRPCRouterRecord;
