import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";

export const timetableRouter = {
  get: authedProcedure
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
