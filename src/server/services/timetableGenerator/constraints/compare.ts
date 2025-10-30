import type { FitnessResult } from "../types";

/**
 * Compare two chromosomes according to hierarchical rules.
 * Used for niched-penalty tournament selection.
 *
 * Rules:
 * 1. Feasible > Infeasible
 * 2. If both feasible: lower soft penalty wins
 * 3. If both infeasible: fewer hard violations wins
 * 4. If same hard violations: lower total penalty wins
 */
export function compareChromosomes(
  fitness1: FitnessResult,
  fitness2: FitnessResult,
): number {
  // Rule 1: Feasible beats infeasible
  if (fitness1.isFeasible && !fitness2.isFeasible) return 1;
  if (!fitness1.isFeasible && fitness2.isFeasible) return -1;

  // Rule 2: Both feasible - compare soft penalties
  if (fitness1.isFeasible && fitness2.isFeasible) {
    if (fitness1.softPenalty < fitness2.softPenalty) return 1;
    if (fitness1.softPenalty > fitness2.softPenalty) return -1;
    return 0; // Equal
  }

  // Rule 3 & 4: Both infeasible - compare hard violations, then total penalty
  if (fitness1.hardViolationCount < fitness2.hardViolationCount) return 1;
  if (fitness1.hardViolationCount > fitness2.hardViolationCount) return -1;

  // Same number of hard violations - compare total penalty
  if (fitness1.totalPenalty < fitness2.totalPenalty) return 1;
  if (fitness1.totalPenalty > fitness2.totalPenalty) return -1;

  return 0; // Equal
}
