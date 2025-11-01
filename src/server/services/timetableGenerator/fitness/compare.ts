import { compareChromosomes } from "../constraints";
import type { FitnessResult } from "../types";

/**
 * Compare two fitness results using hierarchical rules.
 */
export function compareFitness(
  fitness1: FitnessResult,
  fitness2: FitnessResult,
): number {
  return compareChromosomes(fitness1, fitness2);
}

// Convenience re-export for external consumers via fitness barrel
export { compareChromosomes } from "../constraints";
