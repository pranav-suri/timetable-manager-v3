import { z } from "zod";
import { authedProcedure } from "../init";
import type { TRPCRouterRecord } from "@trpc/server";
import { zodIdSchema } from "@/server/utils/zodIdSchema";
import { executeGenerationJob } from "@/server/services/timetableGenerator/jobManager";
import { JobStatus } from "generated/prisma/client";
import { partialGAConfigSchema } from "@/server/services/timetableGenerator/zodSchemas";

export const generateRouter = {
  // Start timetable generation
  start: authedProcedure
    .input(
      z.object({
        timetableId: zodIdSchema,
        config: partialGAConfigSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId, config } = input;

      // Check if timetable exists
      const timetable = await prisma.timetable.findUnique({
        where: { id: timetableId },
      });

      if (!timetable) {
        throw new Error("Timetable not found");
      }

      // Check if there's already a running job
      const existingJob = await prisma.job.findFirst({
        where: {
          timetableId,
          type: "TIMETABLE_GENERATION",
          status: { in: [JobStatus.PENDING, JobStatus.IN_PROGRESS] },
        },
      });

      if (existingJob) {
        throw new Error("Timetable generation already in progress");
      }

      // Create new job
      const job = await prisma.job.create({
        data: {
          type: "TIMETABLE_GENERATION",
          status: JobStatus.PENDING,
          timetableId,
          progress: 0,
        },
      });

      // Start generation in background (fire and forget)
      executeGenerationJob(job.id, timetableId, config).catch((error) => {
        console.error(`Job ${job.id} execution failed to start:`, error);
        // The error is already handled within executeGenerationJob,
        // but we log it here in case the async function itself fails.
      });

      return { jobId: job.id };
    }),

  // Get job status
  status: authedProcedure
    .input(z.object({ jobId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { jobId } = input;

      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new Error("Job not found");
      }

      return {
        id: job.id,
        status: job.status,
        progress: job.progress,
        error: job.error,
        result: job.result, // result is already a JSON object
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      };
    }),

  // Cancel job
  cancel: authedProcedure
    .input(z.object({ jobId: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { jobId } = input;

      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new Error("Job not found");
      }

      if (
        !([JobStatus.PENDING, JobStatus.IN_PROGRESS] as JobStatus[]).includes(
          job.status,
        )
      ) {
        throw new Error("Job cannot be cancelled");
      }

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.CANCELLED,
          error: "Cancelled by user",
        },
      });

      return { success: true };
    }),

  // List jobs for a timetable
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { timetableId } = input;

      const jobs = await prisma.job.findMany({
        where: {
          timetableId,
          type: "TIMETABLE_GENERATION",
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      return {
        jobs: jobs.map((job) => ({
          id: job.id,
          status: job.status,
          progress: job.progress,
          error: job.error,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        })),
      };
    }),
} satisfies TRPCRouterRecord;
