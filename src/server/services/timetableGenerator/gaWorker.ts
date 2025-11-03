/**
 * @file gaWorker.ts
 * @description Worker thread for parallel GA execution.
 *
 * This worker handles the evolution of a single island in the island model.
 * It receives messages from the main thread to initialize, evolve, and handle
 * migration events.
 */

import { parentPort } from "node:worker_threads";
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
import type {
  GAConfig,
  GAInputData,
  Population,
  FitnessResult,
  Chromosome,
} from "./types";

interface WorkerMessage {
  type: "init" | "evolve" | "migrate" | "terminate" | "getBest";
  payload?: any;
}

interface WorkerResponse {
  type: "ready" | "evolved" | "migrated" | "terminated" | "bestChromosome";
  islandId: number;
  payload?: any;
}

// Island state
let islandId: number;
let population: Population;
let fitnesses: FitnessResult[];
let config: GAConfig;
let inputData: GAInputData;
let fitnessCache: FitnessCache;
let generation = 0;

/**
 * Initialize the worker with input data and configuration
 */
function initialize(data: {
  islandId: number;
  inputData: GAInputData;
  config: GAConfig;
}) {
  islandId = data.islandId;
  inputData = data.inputData;
  config = data.config;

  // Initialize fitness cache
  fitnessCache = new FitnessCache(config.populationSize * 2);

  // Initialize population for this island
  population = initializePopulation(config, inputData);

  // Evaluate initial population
  fitnesses = evaluatePopulation(
    population,
    inputData,
    config.constraintWeights,
    fitnessCache,
  );

  const bestIndex = findBestChromosome(population, fitnesses);

  // Send ready signal with initial best fitness
  sendMessage({
    type: "ready",
    islandId,
    payload: {
      bestFitness: fitnesses[bestIndex],
      bestChromosome: population[bestIndex],
      generation: 0,
    },
  });
}

/**
 * Evolve the island for one generation
 */
function evolveGeneration() {
  generation++;
  // Clear fitness cache periodically
  fitnessCache.clear();

  // Select parents
  const parentIndices = selectParents(
    population,
    fitnesses,
    config.tournamentSize,
    config.populationSize,
  );
  const parents = parentIndices.map((i) => population[i]!);

  // Create offspring through crossover and mutation
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

  // Create next generation
  population = performReplacement(population, fitnesses, offspring, config);

  // Evaluate new population
  fitnesses = evaluatePopulation(
    population,
    inputData,
    config.constraintWeights,
    fitnessCache,
  );

  // Find best in this generation
  const bestIndex = findBestChromosome(population, fitnesses);

  // Calculate average fitness
  const avgFitness =
    fitnesses.reduce((sum, f) => sum + f.fitnessScore, 0) / fitnesses.length;

  // Send evolution result
  sendMessage({
    type: "evolved",
    islandId,
    payload: {
      bestFitness: fitnesses[bestIndex],
      bestChromosome: population[bestIndex],
      avgFitness,
      generation,
    },
  });
}

/**
 * Handle migration - receive individuals from other islands and replace worst
 */
function handleMigration(
  migrants: { chromosome: Chromosome; fitness: FitnessResult }[],
) {
  // Sort current population by fitness (ascending - worst first)
  const sortedIndices = fitnesses
    .map((f, idx) => ({ fitness: f.fitnessScore, idx }))
    .sort((a, b) => a.fitness - b.fitness)
    .map((item) => item.idx);

  // Replace worst individuals with migrants
  for (let i = 0; i < migrants.length && i < sortedIndices.length; i++) {
    const worstIdx = sortedIndices[i]!;
    const migrant = migrants[i]!;

    population[worstIdx] = [...migrant.chromosome];
    fitnesses[worstIdx] = migrant.fitness;
  }

  // Update best after migration
  const bestIndex = findBestChromosome(population, fitnesses);

  sendMessage({
    type: "migrated",
    islandId,
    payload: {
      bestFitness: fitnesses[bestIndex],
      bestChromosome: population[bestIndex],
    },
  });
}

/**
 * Get best individuals for migration to other islands
 */
function getBestIndividuals(count: number) {
  // Sort by fitness (descending - best first)
  const sortedIndices = fitnesses
    .map((f, idx) => ({ fitness: f.fitnessScore, idx }))
    .sort((a, b) => b.fitness - a.fitness)
    .map((item) => item.idx);

  // Get top individuals
  const bestIndividuals = sortedIndices.slice(0, count).map((idx) => ({
    chromosome: population[idx]!,
    fitness: fitnesses[idx]!,
  }));

  sendMessage({
    type: "bestChromosome",
    islandId,
    payload: bestIndividuals,
  });
}

/**
 * Send message to parent thread
 */
function sendMessage(message: WorkerResponse) {
  if (parentPort) {
    parentPort.postMessage(message);
  }
}

// Message handler
if (parentPort) {
  parentPort.on("message", (message: WorkerMessage) => {
    try {
      switch (message.type) {
        case "init":
          initialize(message.payload);
          break;
        case "evolve":
          evolveGeneration();
          break;
        case "migrate":
          handleMigration(message.payload.migrants);
          break;
        case "getBest":
          getBestIndividuals(message.payload.count);
          break;
        case "terminate":
          sendMessage({ type: "terminated", islandId });
          process.exit(0);
          break;
        default:
          console.error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Worker ${islandId} error:`, error);
      if (parentPort) {
        parentPort.postMessage({
          type: "error",
          islandId,
          payload: { error: String(error) },
        });
      }
    }
  });
}
