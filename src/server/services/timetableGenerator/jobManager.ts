import { prisma } from "@/server/prisma";
import { JobStatus } from "generated/prisma/client";
import {
  GAInputData,
  Chromosome,
  FitnessResult,
  PartialGAConfig,
  GAResult,
} from "./types";
import { loadTimetableData } from "./dataLoader";
import { runGA } from "./algorithm";
import { mergeConfig, validateConfig } from "./config";
import { GenerationStats } from "./types";
import { chromosomeToLectureSlots } from "./decoder";
import { generateQualityReport } from "./validator";

async function updateJobProgress(
  jobId: string,
  stats: GenerationStats,
  maxGenerations: number,
) {
  const progress = Math.round((stats.generation / maxGenerations) * 100);
  await prisma.job.update({
    where: { id: jobId },
    data: {
      progress,
      result: JSON.stringify({
        currentBestFitness: stats.bestFitness,
        hardViolations: stats.bestHardPenalty,
        softViolations: stats.bestSoftPenalty,
      }),
    },
  });
}

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

    // Throttle progress updates to avoid database timeout
    // Update every 10 generations or at least every 2 seconds
    let lastUpdateTime = Date.now();
    let lastUpdateGeneration = -1;
    const UPDATE_INTERVAL_MS = 2000; // 2 seconds
    const UPDATE_INTERVAL_GENERATIONS = 10;

    const onProgress = async (stats: GenerationStats) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTime;
      const generationsSinceLastUpdate =
        stats.generation - lastUpdateGeneration;

      // Only update if enough time/generations have passed
      const shouldUpdate =
        timeSinceLastUpdate >= UPDATE_INTERVAL_MS ||
        generationsSinceLastUpdate >= UPDATE_INTERVAL_GENERATIONS ||
        stats.generation === 0; // Always update first generation

      if (shouldUpdate) {
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (job?.status === JobStatus.CANCELLED) {
          throw new Error("Job cancelled by user.");
        }
        await updateJobProgress(jobId, stats, config.maxGenerations);
        lastUpdateTime = now;
        lastUpdateGeneration = stats.generation;
      }
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
