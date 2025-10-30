import type {
  Chromosome,
  GAInputData,
  FitnessResult,
  ConstraintWeights,
} from "../types";
import { evaluateChromosome } from "../constraints";
import { FitnessCache } from "./cache";

/**
 * Evaluate the fitness of a chromosome with optional caching.
 */
export function evaluateFitness(
  chromosome: Chromosome,
  inputData: GAInputData,
  weights: ConstraintWeights,
  cache?: FitnessCache,
): FitnessResult {
  if (cache) {
    return cache.get(chromosome, inputData, weights);
  }
  return evaluateChromosome(chromosome, inputData, weights);
}

/**
 * Evaluate fitness for an entire population.
 */
export function evaluatePopulation(
  population: Chromosome[],
  inputData: GAInputData,
  weights: ConstraintWeights,
  cache?: FitnessCache,
): FitnessResult[] {
  return population.map((chromosome) =>
    evaluateFitness(chromosome, inputData, weights, cache),
  );
}

// Convenience re-export for external consumers via fitness barrel
export { evaluateChromosome } from "../constraints";
