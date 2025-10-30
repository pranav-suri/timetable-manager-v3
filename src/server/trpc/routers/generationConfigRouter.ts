import { z } from "zod";
import { authedProcedure, editorProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import { verifyTimetableOwnership } from "../utils/verifyTimetableOwnership";
import type { PartialGAConfig } from "@/server/services/timetableGenerator/types";

// Zod schema for PartialGAConfig
const constraintWeightsSchema = z
  .object({
    hardConstraintWeight: z.number().optional(),
    idleTime: z.number().optional(),
    dailyDistribution: z.number().optional(),
    consecutivePreference: z.number().optional(),
    teacherDailyLimit: z.number().optional(),
    teacherWeeklyLimit: z.number().optional(),
    cognitiveLoad: z.number().optional(),
    excessiveDailyLectures: z.number().optional(),
    excessivelyEmptyDay: z.number().optional(),
    excessivelyFilledDay: z.number().optional(),
    multiDurationLate: z.number().optional(),
    deprioritizedDay: z.number().optional(),
    deprioritizedSlot: z.number().optional(),
    deprioritizedDaySlot: z.number().optional(),
    minLecturesPerDay: z.number().optional(),
    maxLecturesPerDay: z.number().optional(),
    multiDurationPreferredFraction: z.number().optional(),
    deprioritizedDays: z.array(z.number()).optional(),
    deprioritizedSlotNumbers: z.array(z.number()).optional(),
    deprioritizedDaySlots: z
      .array(
        z.object({
          day: z.number(),
          period: z.number(),
        }),
      )
      .optional(),
  })
  .optional();

const partialGAConfigSchema = z.object({
  populationSize: z.number().optional(),
  eliteCount: z.number().optional(),
  heuristicInitRatio: z.number().optional(),
  crossoverProbability: z.number().optional(),
  mutationProbability: z.number().optional(),
  swapMutationRatio: z.number().optional(),
  tournamentSize: z.number().optional(),
  maxGenerations: z.number().optional(),
  maxStagnantGenerations: z.number().optional(),
  targetFitness: z.number().optional(),
  maxExecutionTimeMs: z.number().optional(),
  enableRepair: z.boolean().optional(),
  enableMemetic: z.boolean().optional(),
  enableParallel: z.boolean().optional(),
  randomSeed: z.number().optional(),
  stopOnFeasible: z.boolean().optional(),
  constraintWeights: constraintWeightsSchema,
});

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
              config: generationConfig.config as PartialGAConfig,
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
          config,
        },
        update: {
          config,
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
