import { z } from 'zod'
import { publicProcedure } from '../init'
import type { TRPCRouterRecord } from '@trpc/server'
import { prisma } from '@/server/prisma'

export const tableRouter = {
  /**
   * Get all teachers for a timetable
   */
  teachers: publicProcedure
    .input(z.object({ timetableId: z.number() }))
    .query(async ({ input }) => {
      const { timetableId } = input
      const teachers = await prisma.teacher.findMany({
        where: { timetableId },
      })
      return { teachers }
    }),
  /**
   * Get all subjects for a timetable
   */
  subjects: publicProcedure
    .input(z.object({ timetableId: z.number() }))
    .query(async ({ input }) => {
      const { timetableId } = input
      const groups = await prisma.group.findMany({
        where: { timetableId },
      })
      const subjects = await prisma.subject.findMany({
        where: { groupId: { in: groups.map((group) => group.id) } },
      })
      return { subjects }
    }),
  /**
   * Get all subdivisions for a timetable
   */
  subdivisions: publicProcedure
    .input(z.object({ timetableId: z.number() }))
    .query(async ({ input }) => {
      const { timetableId } = input
      const subdivisions = await prisma.subdivision.findMany({
        where: { timetableId },
      })
      return { subdivisions }
    }),
  timetable: publicProcedure
    .input(
      z.object({
        subdivsionIds: z.array(z.number()),
        timetableId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const slots = await prisma.slot.findMany({
        where: {
          lectureSlots: {
            every: {
              lecture: {
                lectureSubdivisions: {
                  every: {
                    subdivisionId: {
                      in: input.subdivsionIds,
                    },
                  },
                },
              },
            },
          },
          timetableId: input.timetableId,
        },
        include: {
          lectureSlots: {
            include: {
              lecture: {
                include: {
                  teacher: true,
                  subject: true,
                  lectureClassrooms: {
                    include: {
                      classroom: true,
                    },
                  },
                  lectureSubdivisions: {
                    include: {
                      subdivision: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
      return { slots }
    }),
} satisfies TRPCRouterRecord
