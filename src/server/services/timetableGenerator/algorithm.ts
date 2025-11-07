/**
 * @file algorithm.ts
 * @description The main genetic algorithm loop.
 *
 * This file orchestrates the entire evolutionary process by integrating all
 * the individual GA components (initialization, evaluation, selection,
 * crossover, mutation, and replacement). It drives the generation-by-generation
 * process to find an optimal solution to the timetabling problem.
 *
 * @see research.md section 5 "Algorithm Configuration and Execution"
 */
import { cpus } from "node:os";
import { initializePopulation } from "./initialization";
import {
  FitnessCache,
  evaluatePopulation,
  findBestChromosome,
} from "./fitness";
import { selectParents } from "./selection";
import { crossover } from "./crossover";
import { mutate } from "./mutation";
import { performReplacement } from "./replacement";
import { MemoryMonitor } from "./utils/memoryMonitor";
import type {
  GAConfig,
  GAInputData,
  GAResult,
  GenerationStats,
  Population,
  Island,
  IslandWorker,
  MultiThreadedGAConfig,
  WorkerMessage,
  WorkerResponse,
} from "./types";

/**
 * Runs the genetic algorithm to generate a timetable.
 *
 * @param inputData - The pre-processed data required for the GA.
 * @param config - The configuration for the GA run.
 * @param onProgress - Optional callback to report progress. Can be async to allow database updates.
 * @returns A promise that resolves with the results of the GA run.
 */
export async function runGA(
  inputData: GAInputData,
  config: GAConfig,
  onProgress?: (
    stats: GenerationStats,
  ) => void | Promise<void> | Promise<{ cancelled: boolean }>,
): Promise<GAResult> {
  console.log("Starting GA with config:", config);
  const startTime = Date.now();

  // Initialize cache with size limit based on population
  const cacheMaxSize = Math.max(config.populationSize * 2);
  const fitnessCache = new FitnessCache(cacheMaxSize);

  // Initialize memory monitor for large populations
  const memoryMonitor = new MemoryMonitor(10000, 80); // Check every 10s, GC at 80%

  // Log initial memory state
  console.log("Initial memory state:");
  memoryMonitor.check("GA Start");

  // 1. Initialize Population
  let population = initializePopulation(config, inputData);

  // 2. Evaluate Initial Population
  let fitnesses = evaluatePopulation(
    population,
    inputData,
    config.constraintWeights,
    fitnessCache,
  );

  const bestIndex = findBestChromosome(population, fitnesses);
  let bestFitness = fitnesses[bestIndex]!;
  let generationsWithoutImprovement = 0;
  const allGenerationStats: GenerationStats[] = [];

  // Helper to yield control back to the event loop
  const yieldToEventLoop = () =>
    new Promise<void>((resolve) => setImmediate(resolve));

  // 3. Main Evolutionary Loop
  for (let generation = 0; generation < config.maxGenerations; generation++) {
    // Yield to event loop every 10 generations AND clear cache every 50 generations
    if (generation % 1 === 0) await yieldToEventLoop();

    // Monitor memory usage periodically
    // memoryMonitor.check(`Gen ${generation}`);
    // const cacheStats = fitnessCache.getStats();
    fitnessCache.clear();

    // a. Select Parents
    const parentIndices = selectParents(
      population,
      fitnesses,
      config.tournamentSize,
      config.populationSize,
    );
    const parents = parentIndices.map((i) => population[i]!);

    // b. Create Offspring (Crossover + Mutation)
    let offspring: Population = [];
    for (let i = 0; i < config.populationSize; i += 2) {
      const parent1 = parents[i]!;
      const parent2 = parents[i + 1] ?? parents[0]!;

      // Crossover
      let [offspring1, offspring2] = crossover(
        parent1,
        parent2,
        inputData,
        config,
      );

      // Mutation
      offspring1 = mutate(offspring1, inputData, config);
      offspring2 = mutate(offspring2, inputData, config);

      offspring.push(offspring1, offspring2);
    }
    offspring = offspring.slice(0, config.populationSize);

    // c. Evaluate Offspring (not used in current implementation but useful for debugging)
    // evaluatePopulation(
    //   offspring,
    //   inputData,
    //   config.constraintWeights,
    //   fitnessCache,
    // );

    // d. Create Next Generation (Replacement)
    const nextGeneration = performReplacement(
      population,
      fitnesses,
      offspring,
      config,
    );

    population = nextGeneration;
    fitnesses = evaluatePopulation(
      population,
      inputData,
      config.constraintWeights,
      fitnessCache,
    );

    // e. Update Stats and Check Termination
    const bestOfGenerationIndex = findBestChromosome(population, fitnesses);
    const currentBestFitness = fitnesses[bestOfGenerationIndex]!;

    if (currentBestFitness.fitnessScore > bestFitness.fitnessScore) {
      bestFitness = currentBestFitness;
      generationsWithoutImprovement = 0;
    } else {
      generationsWithoutImprovement++;
    }

    const stats: GenerationStats = {
      generation,
      bestFitness: bestFitness.fitnessScore,
      bestHardPenalty: bestFitness.hardPenalty,
      bestSoftPenalty: bestFitness.softPenalty,
      isFeasible: bestFitness.isFeasible,
      avgFitness:
        fitnesses.reduce((sum, f) => sum + f.fitnessScore, 0) /
        fitnesses.length,
      stagnation: generationsWithoutImprovement,
    };
    allGenerationStats.push(stats);

    // Call onProgress callback which will handle database updates
    if (onProgress) {
      const output = await onProgress(stats);
      if (output?.cancelled) {
        console.log("GA run cancelled via onProgress callback.");
        break;
      }
    }

    // Termination Condition: Stagnation
    if (generationsWithoutImprovement >= config.maxStagnantGenerations) {
      console.log(
        `Termination: Stagnation limit of ${config.maxStagnantGenerations} reached.`,
      );
      break;
    }

    // Termination Condition: Feasible solution found (optional)
    if (config.stopOnFeasible && bestFitness.isFeasible) {
      console.log(
        `Termination: Feasible solution found at generation ${generation}.`,
      );
      break;
    }
  }

  const bestChromosomeIndex = findBestChromosome(population, fitnesses);
  const bestChromosome = population[bestChromosomeIndex]!;
  const finalBestFitness = fitnesses[bestChromosomeIndex]!;
  const endTime = Date.now();

  // Final memory statistics
  console.log("\nFinal GA Statistics:");
  console.log(`Total Time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
  console.log(`Cache Stats:`, fitnessCache.getStats());
  console.log(`Memory Trend:`, memoryMonitor.getTrend());
  memoryMonitor.check("GA End");

  return {
    bestChromosome,
    bestFitness: finalBestFitness,
    stats: allGenerationStats,
    totalTime: endTime - startTime,
  };
}

/**
 * Runs the genetic algorithm using actual worker threads with an island model.
 *
 * This implementation creates true worker threads, each running an independent
 * island population. Workers communicate via message passing to coordinate
 * migration and track overall progress.
 *
 * Benefits:
 * - True parallelization across CPU cores (not just async)
 * - Each worker has isolated memory space
 * - Better CPU utilization for compute-intensive fitness evaluation
 * - Near-linear speedup on multi-core systems
 *
 * @param inputData - The pre-processed data required for the GA.
 * @param config - The configuration for the GA run.
 * @param multiThreadConfig - Configuration for multi-threaded execution.
 * @param onProgress - Optional callback to report progress. Can be async to allow database updates.
 * @returns A promise that resolves with the results of the GA run.
 *
 * @example
 * ```typescript
 * const result = await runGAMultiThreaded(
 *   inputData,
 *   config,
 *   {
 *     numIslands: 4,
 *     migrationInterval: 50,
 *     migrationSize: 2,
 *     migrationStrategy: 'best'
 *   },
 *   (stats) => console.log(`Gen ${stats.generation}: ${stats.bestFitness}`)
 * );
 * ```
 */
export async function runGAMultiThreaded(
  inputData: GAInputData,
  config: GAConfig,
  onProgress?: (
    stats: GenerationStats,
  ) => void | Promise<void> | Promise<{ cancelled: boolean }>,
): Promise<GAResult> {
  const startTime = Date.now();
  const multiThreadConfig = config.multiThreadConfig;

  // Determine number of islands (default to CPU count - 1, keeping one for main thread)
  const numCPUs = cpus().length;

  console.log(`System has ${numCPUs} CPU cores.`);

  const numIslands = multiThreadConfig.numIslands;

  config["eliteCount"] = Math.max(
    1,
    Math.floor(config.eliteCount / numIslands),
  );
  config["tournamentSize"] = Math.max(
    2,
    Math.floor(config.tournamentSize / numIslands),
  );

  const migrationInterval = multiThreadConfig.migrationInterval;
  const migrationSize = multiThreadConfig.migrationSize;
  const migrationStrategy = multiThreadConfig.migrationStrategy;

  console.log(
    `Starting Multi-Threaded GA with ${numIslands} islands on ${numCPUs} CPU cores`,
  );
  console.log(
    `Migration: every ${migrationInterval} generations, ${migrationSize} individuals using ${migrationStrategy} strategy`,
  );

  // Adjust population size per island
  const populationPerIsland = Math.floor(config.populationSize / numIslands);
  const islandConfig: GAConfig = {
    ...config,
    populationSize: populationPerIsland,
    eliteCount: Math.max(1, Math.floor(config.eliteCount / numIslands)),
  };

  // Create worker threads for each island
  const workerUrl = new URL("./gaWorker.ts", import.meta.url);
  const islandWorkers: IslandWorker[] = [];
  const workerPromises: Map<
    number,
    { resolve: (value: any) => void; reject: (error: any) => void }
  > = new Map();

  // Initialize workers
  for (let i = 0; i < numIslands; i++) {
    const worker = new Worker(workerUrl);

    const islandWorker: IslandWorker = {
      id: i,
      worker,
      bestFitness: {
        totalPenalty: Infinity,
        fitnessScore: 0,
        isFeasible: false,
        hardPenalty: Infinity,
        softPenalty: 0,
        hardViolations: [],
        softViolations: [],
        hardViolationCount: 0,
        softViolationCount: 0,
      },
      bestChromosome: [],
      avgFitness: 0,
      generation: 0,
    };

    // Set up message handler for this worker (Bun uses addEventListener)
    worker.addEventListener("message", (event: MessageEvent) => {
      const message = event.data as WorkerResponse;
      const promise = workerPromises.get(message.islandId);
      if (promise) {
        promise.resolve(message);
        workerPromises.delete(message.islandId);
      }

      // Update island state
      if (
        message.type === "ready" ||
        message.type === "evolved" ||
        message.type === "migrated"
      ) {
        islandWorker.bestFitness = message.payload.bestFitness;
        islandWorker.bestChromosome = message.payload.bestChromosome;
        islandWorker.avgFitness = message.payload.avgFitness ?? 0;
        islandWorker.generation = message.payload.generation ?? 0;
      }
    });

    worker.addEventListener("error", (error: ErrorEvent) => {
      console.error(`Worker ${i} error:`, error);
      const promise = workerPromises.get(i);
      if (promise) {
        promise.reject(error);
        workerPromises.delete(i);
      }
    });

    islandWorkers.push(islandWorker);

    // Initialize this worker
    await new Promise<void>((resolve, reject) => {
      workerPromises.set(i, { resolve: () => resolve(), reject });
      worker.postMessage({
        type: "init",
        payload: {
          islandId: i,
          inputData,
          config: islandConfig,
        },
      } satisfies WorkerMessage);
    });
  }

  console.log(`All ${numIslands} worker threads initialized`);

  // Track overall best
  let globalBestFitness = islandWorkers[0]!.bestFitness;
  let globalBestChromosome = islandWorkers[0]!.bestChromosome;
  let generationsWithoutImprovement = 0;
  const allGenerationStats: GenerationStats[] = [];

  // Main evolution loop
  for (let generation = 0; generation < config.maxGenerations; generation++) {
    // Tell all workers to evolve one generation
    const evolvePromises = islandWorkers.map((iw) => {
      return new Promise<void>((resolve, reject) => {
        workerPromises.set(iw.id, { resolve: () => resolve(), reject });
        iw.worker.postMessage({ type: "evolve" } satisfies WorkerMessage);
      });
    });

    // Wait for all workers to complete their generation
    await Promise.all(evolvePromises);

    // Update global best from all workers
    let generationBestFitness = islandWorkers[0]!.bestFitness;
    let generationBestChromosome = islandWorkers[0]!.bestChromosome;

    for (const iw of islandWorkers) {
      if (iw.bestFitness.fitnessScore > generationBestFitness.fitnessScore) {
        generationBestFitness = iw.bestFitness;
        generationBestChromosome = iw.bestChromosome;
      }
    }

    // Update global best tracker
    if (generationBestFitness.fitnessScore > globalBestFitness.fitnessScore) {
      globalBestFitness = generationBestFitness;
      globalBestChromosome = generationBestChromosome;
      generationsWithoutImprovement = 0;
    } else {
      generationsWithoutImprovement++;
    }

    // Calculate average fitness across all islands
    const totalFitness = islandWorkers.reduce(
      (sum, iw) => sum + iw.avgFitness,
      0,
    );
    const avgFitness = totalFitness / islandWorkers.length;

    // Create generation stats
    const stats: GenerationStats = {
      generation,
      bestFitness: globalBestFitness.fitnessScore,
      bestHardPenalty: globalBestFitness.hardPenalty,
      bestSoftPenalty: globalBestFitness.softPenalty,
      isFeasible: globalBestFitness.isFeasible,
      avgFitness,
      stagnation: generationsWithoutImprovement,
    };
    allGenerationStats.push(stats);

    // Report progress
    if (onProgress) {
      const output = await onProgress(stats);
      if (output?.cancelled) {
        console.log("GA run cancelled via onProgress callback.");
        await terminateWorkers(islandWorkers);
        break;
      }
    }

    // Perform migration between islands
    if ((generation + 1) % migrationInterval === 0 && generation > 0) {
      await performWorkerMigration(
        islandWorkers,
        migrationSize,
        migrationStrategy,
        workerPromises,
      );
      console.log(`Migration completed at generation ${generation + 1}`);
    }

    // Check termination conditions
    if (generationsWithoutImprovement >= config.maxStagnantGenerations) {
      console.log(
        `Termination: Stagnation limit of ${config.maxStagnantGenerations} reached.`,
      );
      break;
    }

    if (config.stopOnFeasible && globalBestFitness.isFeasible) {
      console.log(
        `Termination: Feasible solution found at generation ${generation}.`,
      );
      break;
    }
  }

  // Terminate all workers
  await terminateWorkers(islandWorkers);

  const endTime = Date.now();

  console.log("\nMulti-Threaded GA Statistics:");
  console.log(`Total Time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
  console.log(`Number of Islands: ${numIslands}`);
  console.log(`Best Fitness: ${globalBestFitness.fitnessScore.toFixed(6)}`);
  console.log(`Is Feasible: ${globalBestFitness.isFeasible}`);

  return {
    bestChromosome: globalBestChromosome,
    bestFitness: globalBestFitness,
    stats: allGenerationStats,
    totalTime: endTime - startTime,
  };
}

/**
 * Performs migration of individuals between worker threads.
 *
 * Uses ring topology: each island sends migrants to the next island.
 * Workers coordinate migration via message passing.
 */
async function performWorkerMigration(
  islandWorkers: IslandWorker[],
  migrationSize: number,
  _strategy: "best" | "random" | "diverse", // TODO: Implement different migration strategies in worker
  workerPromises: Map<
    number,
    { resolve: (value: any) => void; reject: (error: any) => void }
  >,
): Promise<void> {
  const numIslands = islandWorkers.length;

  // Request best individuals from each worker
  const migrantRequests = islandWorkers.map((iw) => {
    return new Promise<{ islandId: number; migrants: any[] }>((resolve) => {
      const handler = (event: MessageEvent) => {
        const message = event.data as WorkerResponse;
        if (message.type === "bestChromosome" && message.islandId === iw.id) {
          iw.worker.removeEventListener("message", handler);
          resolve({ islandId: iw.id, migrants: message.payload });
        }
      };

      // Temporarily add message handler for this specific request
      iw.worker.addEventListener("message", handler);

      // Request best individuals
      iw.worker.postMessage({
        type: "getBest",
        payload: { count: migrationSize },
      } satisfies WorkerMessage);
    });
  });

  // Wait for all workers to send their best individuals
  const migrantData = await Promise.all(migrantRequests);

  // Send migrants to next island in ring (i -> (i+1) % numIslands)
  const migrationPromises = islandWorkers.map((iw, i) => {
    const sourceIslandId = (i - 1 + numIslands) % numIslands; // Previous island sends to this one
    const migrants =
      migrantData.find((m) => m.islandId === sourceIslandId)?.migrants ?? [];

    return new Promise<void>((resolve, reject) => {
      workerPromises.set(iw.id, { resolve: () => resolve(), reject });
      iw.worker.postMessage({
        type: "migrate",
        payload: { migrants },
      } satisfies WorkerMessage);
    });
  });

  // Wait for all migrations to complete
  await Promise.all(migrationPromises);
}

async function terminateWorkers(islandWorkers: IslandWorker[]) {
  for (const iw of islandWorkers) {
    iw.worker.postMessage({ type: "terminate" } satisfies WorkerMessage);
    await iw.worker.terminate();
  }
}
