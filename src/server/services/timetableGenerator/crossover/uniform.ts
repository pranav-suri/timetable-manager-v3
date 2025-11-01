import type { Chromosome, GAConfig, Gene } from "../types";

/**
 * Perform uniform crossover on two parent chromosomes.
 */
export function uniformCrossover(
  parent1: Chromosome,
  parent2: Chromosome,
  _config: GAConfig,
): [Chromosome, Chromosome] {
  if (parent1.length !== parent2.length) {
    throw new Error(
      `Parent chromosomes must have same length: ${parent1.length} vs ${parent2.length}`,
    );
  }

  const offspring1: Chromosome = [];
  const offspring2: Chromosome = [];

  for (let i = 0; i < parent1.length; i++) {
    const gene1 = parent1[i]!;
    const gene2 = parent2[i]!;

    // Deep copy to avoid reference sharing
    let offspring1Gene: Gene;
    let offspring2Gene: Gene;

    // Special handling for locked genes
    if (gene1.isLocked || gene2.isLocked) {
      // If either gene is locked, both offspring get the locked version
      const lockedGene = gene1.isLocked ? gene1 : gene2;
      offspring1Gene = { ...lockedGene };
      offspring2Gene = { ...lockedGene };
    } else {
      // Random 50/50 choice for each offspring
      if (Math.random() < 0.5) {
        // Offspring1 gets gene1, Offspring2 gets gene2
        offspring1Gene = { ...gene1 };
        offspring2Gene = { ...gene2 };
      } else {
        // Offspring1 gets gene2, Offspring2 gets gene1
        offspring1Gene = { ...gene2 };
        offspring2Gene = { ...gene1 };
      }
    }

    offspring1.push(offspring1Gene);
    offspring2.push(offspring2Gene);
  }

  return [offspring1, offspring2];
}
