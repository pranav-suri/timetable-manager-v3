import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import {
  verifyEntityOwnership,
  verifyTimetableOwnership,
} from "../utils/verifyTimetableOwnership";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";

export const subdivisionGroupTempRouter = {
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      await verifyTimetableOwnership(ctx, timetableId);

      const subdivisionGroupTemp = await prisma.subdivisionGroupTemp.findMany({
        where: { timetableId },
      });
      return { subdivisionGroupTemp };
    }),
} satisfies TRPCRouterRecord;
