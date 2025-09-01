import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import type { TrpcContext } from "../init";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const timetableRouter = {
  list: authedProcedure
    .query(async ({ ctx }) => {
      const { prisma } = ctx;
      const timetables = await prisma.timetable.findMany();
      return { timetables };
    }),
  add: authedProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, name } = input;
      const timetable = await prisma.timetable.create({
        data: { id, name },
      });
      return { timetable };
    }),
  update: authedProcedure
    .input(
      z.object({
        id: zodIdSchema,
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id, name } = input;
      const timetable = await prisma.timetable.update({
        where: { id },
        data: { name },
      });
      return { timetable };
    }),
  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { id } = input;
      const timetable = await prisma.timetable.delete({ where: { id } });
      return { timetable };
    }),
  get: authedProcedure
    .input(
      z.object({
        subdivisionIds: z.array(zodIdSchema),
        timetableId: zodIdSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const { timetableId, subdivisionIds } = input;

      return getTimetable(ctx, timetableId, subdivisionIds);
    }),
  /**
   * Only for testing, gets the second timetable and 3 subdivisions, the selections were chosen according to sample data
   */
  getAny: authedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;
    const tt = await prisma.timetable.findFirstOrThrow({
      where: { name: "ODD" },
    });

    const subdiv = await prisma.subdivision.findMany({
      where: {
        timetableId: tt.id,
        name: {
          in: ["SY CS A1", "SY CS A2", "SY CS A3"],
        },
      },
    });

    const subdivIds = subdiv.map((s) => s.id);
    return await getTimetable(ctx, tt.id, subdivIds);
  }),
} satisfies TRPCRouterRecord;

async function getTimetable(
  ctx: TrpcContext,
  timetableId: string,
  subdivisionIds: string[],
) {
  // console.log("Fetched timetable");
  const { prisma } = ctx;
  const slots = await prisma.slot.findMany({
    where: {
      timetableId: timetableId,
    },
    include: {
      lectureSlots: {
        where: {
          lecture: {
            lectureSubdivisions: {
              some: {
                subdivisionId: {
                  in: subdivisionIds,
                },
              },
            },
          },
        },
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
                where: {
                  subdivisionId: {
                    in: subdivisionIds,
                  },
                },
                orderBy: {
                  subdivision: {
                    name: "asc",
                  },
                },
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

  // console.log(JSON.stringify(slots, null, 2));
  return { slots };
}
