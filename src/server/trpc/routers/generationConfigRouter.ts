import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import { verifyTimetableOwnership } from "../utils/verifyTimetableOwnership";
import type { TRPCRouterRecord } from "@trpc/server";
import type { PartialGAConfig } from "@/server/services/timetableGenerator/types";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import { partialGAConfigSchema } from "src/server/services/timetableGenerator/zodSchemas";

export const generationConfigRouter = {
  // Get the generation config for a timetable
  get: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      // Verify timetable belongs to user's organization
      await verifyTimetableOwnership(ctx, timetableId);

      const generationConfig = await prisma.generationConfig.findUnique({
        where: { timetableId },
      });

      return {
        generationConfig: generationConfig
          ? {
              id: generationConfig.id,
              timetableId: generationConfig.timetableId,
              config: generationConfig.config,
              createdAt: generationConfig.createdAt,
              updatedAt: generationConfig.updatedAt,
            }
          : null,
      };
    }),

  // Save or update the generation config for a timetable
  save: editorProcedure
    .input(
      z.object({
        timetableId: zodIdSchema,
        config: partialGAConfigSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId, config } = input;
      // Verify timetable belongs to user's organization
      await verifyTimetableOwnership(ctx, timetableId);

      const generationConfig = await prisma.generationConfig.upsert({
        where: { timetableId },
        create: {
          timetableId,
          config: JSON.stringify(config),
        },
        update: {
          config: JSON.stringify(config),
        },
      });

      return {
        generationConfig: {
          id: generationConfig.id,
          timetableId: generationConfig.timetableId,
          config: generationConfig.config as PartialGAConfig,
          createdAt: generationConfig.createdAt,
          updatedAt: generationConfig.updatedAt,
        },
      };
    }),

  // Delete the generation config for a timetable
  delete: editorProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      // Verify timetable belongs to user's organization
      await verifyTimetableOwnership(ctx, timetableId);

      await prisma.generationConfig.delete({
        where: { timetableId },
      });

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
