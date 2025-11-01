import {
  FitnessCache,
  calculatePopulationStats,
  evaluatePopulation,
} from "../fitness";
import type { FitnessResult, GAConfig, GAInputData } from "../types";
import type { PopulationFitnessStats } from "../fitness";

/**
 * Evaluate the initial population and return fitness results with statistics.
 */
export function evaluateInitialPopulation(
  population: { length: number } & any[],
  inputData: GAInputData,
  config: GAConfig,
): {
  fitnessResults: FitnessResult[];
  stats: PopulationFitnessStats;
} {
  console.log(`\nEvaluating initial population...`);

  const cache = new FitnessCache();
  const startTime = Date.now();

  const fitnessResults = evaluatePopulation(
    population as any,
    inputData,
    config.constraintWeights,
    cache,
  );

  const evaluationTime = Date.now() - startTime;
  const stats = calculatePopulationStats(fitnessResults);

  console.log(`  Best fitness: ${stats.bestFitness.toFixed(4)}`);
  console.log(`  Average fitness: ${stats.averageFitness.toFixed(4)}`);
  console.log(`  Worst fitness: ${stats.worstFitness.toFixed(4)}`);
  console.log(
    `  Feasible solutions: ${stats.feasibleCount} / ${population.length} (${(stats.feasibleRatio * 100).toFixed(1)}%)`,
  );
  console.log(
    `  Average hard violations: ${stats.averageHardViolations.toFixed(1)}`,
  );
  console.log(
    `  Average soft violations: ${stats.averageSoftViolations.toFixed(1)}`,
  );
  console.log(
    `\nInitialization complete in ${(evaluationTime / 1000).toFixed(1)}s`,
  );

  const cacheStats = cache.getStats();
  if (cacheStats.hits > 0) {
    console.log(
      `  Cache hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}% (${cacheStats.hits} hits, ${cacheStats.misses} misses)`,
    );
  }

  return { fitnessResults, stats };
}
