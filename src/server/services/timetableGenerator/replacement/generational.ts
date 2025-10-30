import type { Population, FitnessResult, GAConfig } from "../types";
import { selectElites } from "./elitism";

/**
 * Creates the next generation by combining elites and offspring.
 */
export function performReplacement(
  population: Population,
  fitnesses: FitnessResult[],
  offspring: Population,
  config: GAConfig,
): Population {
  const { populationSize, eliteCount } = config;

  // 1. Select the elites from the current population
  const elites = selectElites(population, fitnesses, eliteCount);

  // 2. Fill the rest of the population with offspring
  const offspringCount = populationSize - eliteCount;
  const nextGeneration = [...elites, ...offspring.slice(0, offspringCount)];

  // Ensure the population size is maintained
  if (nextGeneration.length !== populationSize) {
    console.warn(
      `Population size mismatch. Expected ${populationSize}, got ${nextGeneration.length}. Adjusting...`,
    );
    while (nextGeneration.length < populationSize && offspring.length > 0) {
      nextGeneration.push(offspring.pop()!);
    }
    if (nextGeneration.length !== populationSize) {
      throw new Error(
        `Could not create a new generation with the correct population size. Not enough offspring.`,
      );
    }
  }

  return nextGeneration;
}
