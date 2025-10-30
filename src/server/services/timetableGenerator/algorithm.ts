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

import type {
  GAInputData,
  GAConfig,
  Population,
  GAResult,
  GenerationStats,
} from "./types";
import { initializePopulation } from "./initialization";
import {
  evaluatePopulation,
  findBestChromosome,
  FitnessCache,
} from "./fitness";
import { selectParents } from "./selection";
import { crossover } from "./crossover";
import { mutate } from "./mutation";
import { performReplacement } from "./replacement";

/**
 * Runs the genetic algorithm to generate a timetable.
 *
 * @param inputData - The pre-processed data required for the GA.
 * @param config - The configuration for the GA run.
 * @param onProgress - Optional callback to report progress.
 * @returns A promise that resolves with the results of the GA run.
 */
export async function runGA(
  inputData: GAInputData,
  config: GAConfig,
  onProgress?: (stats: GenerationStats) => void,
): Promise<GAResult> {
  const startTime = Date.now();
  const fitnessCache = new FitnessCache();

  // 1. Initialize Population
  let population = initializePopulation(config, inputData);

  // 2. Evaluate Initial Population
  let fitnesses = evaluatePopulation(
    population,
    inputData,
    config.constraintWeights,
    fitnessCache,
  );

  let bestIndex = findBestChromosome(population, fitnesses);
  let bestFitness = fitnesses[bestIndex]!;
  let generationsWithoutImprovement = 0;
  const allGenerationStats: GenerationStats[] = [];

  // 3. Main Evolutionary Loop
  for (let generation = 0; generation < config.maxGenerations; generation++) {
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
    onProgress?.(stats);

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

  return {
    bestChromosome,
    bestFitness: finalBestFitness,
    stats: allGenerationStats,
    totalTime: endTime - startTime,
  };
}
