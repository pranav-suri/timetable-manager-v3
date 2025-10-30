import type { Chromosome, FitnessResult } from "../types";
import { compareFitness } from "./compare";

/**
 * Find the best chromosome in a population according to fitness.
 */
export function findBestChromosome(
  population: Chromosome[],
  fitnessResults: FitnessResult[],
): number {
  if (population.length === 0) {
    throw new Error("Cannot find best chromosome in empty population");
  }

  let bestIndex = 0;
  let bestFitness = fitnessResults[0];

  for (let i = 1; i < population.length; i++) {
    if (compareFitness(fitnessResults[i]!, bestFitness!) > 0) {
      bestIndex = i;
      bestFitness = fitnessResults[i];
    }
  }

  return bestIndex;
}

/**
 * Find the worst chromosome in a population according to fitness.
 */
export function findWorstChromosome(
  population: Chromosome[],
  fitnessResults: FitnessResult[],
): number {
  if (population.length === 0) {
    throw new Error("Cannot find worst chromosome in empty population");
  }

  let worstIndex = 0;
  let worstFitness = fitnessResults[0];

  for (let i = 1; i < population.length; i++) {
    if (compareFitness(fitnessResults[i]!, worstFitness!) < 0) {
      worstIndex = i;
      worstFitness = fitnessResults[i];
    }
  }

  return worstIndex;
}
