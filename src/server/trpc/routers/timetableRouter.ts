import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { authedProcedure, editorProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import type { TrpcContext } from "../init";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const timetableRouter = {
  list: authedProcedure.query(async ({ ctx }) => {
    const { prisma, session } = ctx;
    const timetables = await prisma.timetable.findMany({
      where: {
        organizationId: session.organizationId,
      },
      orderBy: { createdAt: "desc" },
    });
    return { timetables };
  }),
  add: editorProcedure
    .input(
      z.object({
        id: zodIdSchema.optional(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const { id, name } = input;
      const timetable = await prisma.timetable.create({
        data: {
          id,
          name,
          organizationId: session.organizationId,
        },
      });
      return { timetable };
    }),
  update: editorProcedure
    .input(
      z.object({
        id: zodIdSchema,
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const { id, name } = input;

      // Verify timetable belongs to user's organization
      const existing = await prisma.timetable.findFirst({
        where: {
          id,
          organizationId: session.organizationId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const timetable = await prisma.timetable.update({
        where: { id },
        data: { name },
      });
      return { timetable };
    }),
  delete: editorProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const { id } = input;

      // Verify timetable belongs to user's organization
      const existing = await prisma.timetable.findFirst({
        where: {
          id,
          organizationId: session.organizationId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

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
} satisfies TRPCRouterRecord;

async function getTimetable(
  ctx: TrpcContext,
  timetableId: string,
  subdivisionIds: string[],
) {
  // console.log("Fetched timetable");
  const { prisma, session } = ctx;

  // Verify timetable belongs to user's organization
  if (session) {
    const timetable = await prisma.timetable.findFirst({
      where: {
        id: timetableId,
        organizationId: session.organizationId,
      },
    });

    if (!timetable) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Timetable not found",
      });
    }
  }

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
