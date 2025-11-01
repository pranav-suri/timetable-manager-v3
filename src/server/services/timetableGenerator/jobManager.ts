import { JobStatus } from "generated/prisma/client";
import { loadTimetableData } from "./dataLoader";
import { runGA } from "./algorithm";
import { mergeConfig, validateConfig } from "./config";
import { chromosomeToLectureSlots } from "./decoder";
import { generateQualityReport } from "./validator";
import type {
  Chromosome,
  FitnessResult,
  GAInputData,
  GAResult,
  GenerationStats,
  PartialGAConfig,
} from "./types";
import { prisma } from "@/server/prisma";

async function persistResults(
  jobId: string,
  timetableId: string,
  bestChromosome: Chromosome,
  inputData: GAInputData,
  fitnessResult: FitnessResult,
) {
  const newSlotsData = chromosomeToLectureSlots(bestChromosome, inputData);

  // NOTE: LectureClassroom assignments are NOT built from the chromosome
  // because classrooms are now immutable per lecture (combinedClassrooms).
  // The LectureClassroom records already exist in the database and should not
  // be modified by the timetable generation process.
  // We only update LectureSlot records (timeslot assignments).

  const qualityReport = generateQualityReport(bestChromosome, inputData);

  await prisma.$transaction(async (tx) => {
    const lectures = await tx.lecture.findMany({
      where: { timetableId },
      select: { id: true },
    });

    const lectureIds = lectures.map((l) => l.id);

    // Delete existing LectureSlots
    await tx.lectureSlot.deleteMany({
      where: { lectureId: { in: lectureIds } },
    });

    // NOTE: We do NOT delete or modify LectureClassroom records because
    // classrooms are now immutable per lecture and should not change during
    // timetable generation. Only timeslot assignments (LectureSlot) are modified.

    // Create new slot assignments
    await tx.lectureSlot.createMany({
      data: newSlotsData,
    });

    await tx.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        result: JSON.stringify({
          fitnessScore: fitnessResult.fitnessScore,
          hardViolations: fitnessResult.hardViolationCount,
          softViolations: fitnessResult.softViolationCount,
          isFeasible: fitnessResult.isFeasible,
          qualityReport,
        }),
      },
    });
  });
}

async function handleJobError(jobId: string, error: Error) {
  console.error(`Job ${jobId} failed:`, error);
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: JobStatus.FAILED,
      error: error.message,
    },
  });
}

export async function executeGenerationJob(
  jobId: string,
  timetableId: string,
  userConfig: PartialGAConfig = {},
) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.IN_PROGRESS },
    });

    const inputData = await loadTimetableData(timetableId, prisma);
    const config = mergeConfig(userConfig);
    validateConfig(config);

    // Progress callback - now properly async
    const onProgress = async (stats: GenerationStats) => {
      // Check if job was cancelled
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (job?.status === JobStatus.CANCELLED) {
        throw new Error("Job cancelled by user.");
      }

      // Update progress
      const progress = Math.round(
        (stats.generation / config.maxGenerations) * 100,
      );
      await prisma.job.update({
        where: { id: jobId },
        data: {
          progress,
          result: JSON.stringify({
            metadata: {
              currentGeneration: stats.generation,
              maxGenerations: config.maxGenerations,
              bestFitness: stats.bestFitness,
              avgFitness: stats.avgFitness,
              hardViolations: stats.bestHardPenalty,
              softViolations: stats.bestSoftPenalty,
              isFeasible: stats.isFeasible,
              stagnation: stats.stagnation,
            },
          }),
        },
      });
    };

    const gaResult: GAResult = await runGA(inputData, config, onProgress);

    await persistResults(
      jobId,
      timetableId,
      gaResult.bestChromosome,
      inputData,
      gaResult.bestFitness,
    );
  } catch (error) {
    if (error instanceof Error) {
      await handleJobError(jobId, error);
    } else {
      await handleJobError(jobId, new Error("An unknown error occurred."));
    }
  }
}
