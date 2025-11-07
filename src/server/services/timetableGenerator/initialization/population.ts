import { initializeHeuristicChromosome } from "./heuristic";
import { initializeRandomChromosome } from "./random";
import type { GAConfig, GAInputData, Population } from "../types";

/**
 * Initialize a complete population with hybrid strategy.
 */
export function initializePopulation(
  config: GAConfig,
  inputData: GAInputData,
): Population {
  const population: Population = [];

  // Calculate counts
  const heuristicCount = Math.floor(
    config.populationSize * config.heuristicInitRatio,
  );
  const randomCount = config.populationSize - heuristicCount;

  console.log(`Initializing population: Total: ${config.populationSize}`);
  console.log(`  Heuristic: ${heuristicCount} Random: ${randomCount}`);

  // Generate heuristic chromosomes
  for (let i = 0; i < heuristicCount; i++) {
    population.push(initializeHeuristicChromosome(inputData));
  }

  // Generate random chromosomes
  for (let i = 0; i < randomCount; i++) {
    population.push(initializeRandomChromosome(inputData));
  }

  // Shuffle population using Fisher-Yates algorithm
  for (let i = population.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [population[i], population[j]] = [population[j]!, population[i]!];
  }

  // Validate
  if (population.length !== config.populationSize) {
    throw new Error(
      `Population size mismatch: expected ${config.populationSize}, got ${population.length}`,
    );
  }

  for (const chromosome of population) {
    if (chromosome.length !== inputData.totalEvents) {
      throw new Error(
        `Chromosome length mismatch: expected ${inputData.totalEvents}, got ${chromosome.length}`,
      );
    }
  }

  return population;
}
