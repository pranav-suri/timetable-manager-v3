/**
 * Calculate adaptive mutation probability based on population diversity.
 * Placeholder for future enhancement; matches original behavior.
 */
export function adaptiveMutationProbability(
  baseProbability: number,
  diversity: number,
): number {
  // Simple linear adjustment
  const diversityThreshold = 0.5;

  if (diversity < diversityThreshold) {
    // Low diversity: increase mutation up to 2x base rate
    const multiplier = 1 + (diversityThreshold - diversity);
    return Math.min(baseProbability * multiplier, baseProbability * 2);
  } else {
    // High diversity: use base rate
    return baseProbability;
  }
}
