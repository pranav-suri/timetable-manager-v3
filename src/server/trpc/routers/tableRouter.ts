import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";

export const tableRouter = {
  /**
   * Get all teachers for a timetable
   */
  teachers: {
    list: authedProcedure
      .input(z.object({ timetableId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { prisma } = ctx;
        const { timetableId } = input;

        const teachers = await prisma.teacher.findMany({
          where: { timetableId },
        });
        return { teachers };
      }),

    add: authedProcedure
      .input(
        z.object({
          timetableId: z.number(),
          name: z.string(),
          email: z.string().email(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { prisma } = ctx;
        const { timetableId, name, email } = input;

        const teacher = await prisma.teacher.create({
          data: {
            timetableId,
            name,
            email,
          },
        });
        return { teacher };
      }),
  },
  /**
   * Get all subjects for a timetable
   */
  subjects: {
    list: authedProcedure
      .input(z.object({ timetableId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { prisma } = ctx;
        const { timetableId } = input;

        const groups = await prisma.group.findMany({
          where: { timetableId },
        });
        const subjects = await prisma.subject.findMany({
          where: { groupId: { in: groups.map((group) => group.id) } },
        });
        return { subjects };
      }),
    add: authedProcedure
      .input(
        z.object({
          timetableId: z.number(),
          name: z.string(),
          duration: z.number(),
          groupId: z.number(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { prisma } = ctx;
        const { timetableId, name, duration, groupId } = input;

        const group = await prisma.group.findUniqueOrThrow({
          where: { id: groupId, timetableId },
        });
        const subject = await prisma.subject.create({
          data: {
            name,
            duration,
            groupId: group.id,
          },
        });
        return { subject };
      }),
  },

  /**
   * Get all groups for a timetable
   */
  groups: {
    list: authedProcedure
      .input(
        z.object({
          timetableId: z.number(),
          allowSimultaneous: z.boolean(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { prisma } = ctx;
        const { timetableId } = input;

        const groups = await prisma.group.findMany({
          where: { timetableId },
        });
        return { groups };
      }),
    add: authedProcedure
      .input(
        z.object({
          timetableId: z.number(),
          name: z.string(),
          allowSimultaneous: z.boolean(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { prisma } = ctx;
        const { timetableId, name, allowSimultaneous } = input;

        const group = await prisma.group.create({
          data: {
            timetableId,
            name,
            allowSimultaneous,
          },
        });
        return { group };
      }),
  },

  /**
   * Get all subdivisions for a timetable
   */
  subdivisions: {
    list: authedProcedure
      .input(z.object({ timetableId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { prisma } = ctx;
        const { timetableId } = input;

        const subdivisions = await prisma.subdivision.findMany({
          where: { timetableId },
        });
        return { subdivisions };
      }),
    add: authedProcedure
      .input(z.object({ timetableId: z.number(), name: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { prisma } = ctx;
        const { timetableId, name } = input;

        const subdivision = await prisma.subdivision.create({
          data: {
            timetableId,
            name,
          },
        });
        return { subdivision };
      }),
  },
  timetable: authedProcedure
    .input(
      z.object({
        subdivsionIds: z.array(z.number()),
        timetableId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId, subdivsionIds } = input;

      const slots = await prisma.slot.findMany({
        where: {
          lectureSlots: {
            every: {
              lecture: {
                lectureSubdivisions: {
                  every: {
                    subdivisionId: {
                      in: subdivsionIds,
                    },
                  },
                },
              },
            },
          },
          timetableId: timetableId,
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
      });
      return { slots };
    }),
} satisfies TRPCRouterRecord;
