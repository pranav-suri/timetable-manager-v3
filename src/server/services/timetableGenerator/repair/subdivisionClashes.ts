import type { Chromosome, GAInputData } from "../types";
import { MAX_REPAIR_ATTEMPTS } from "./constants";
import { findValidSlotForGene } from "./helpers";
import { checkSubdivisionClash } from "../constraints";

export function repairSubdivisionClashes(
  chromosome: Chromosome,
  inputData: GAInputData,
): Chromosome {
  let attempts = 0;
  let violations = checkSubdivisionClash(chromosome, inputData);

  while (violations.length > 0 && attempts < MAX_REPAIR_ATTEMPTS) {
    const violation = violations[0]!;

    // Try to move one of the conflicting genes
    const geneIndex = violation.geneIndices[0]!;
    const gene = chromosome[geneIndex]!;

    if (gene.isLocked) {
      violations.shift();
      continue;
    }

    const newSlot = findValidSlotForGene(gene, chromosome, inputData);
    if (newSlot) {
      chromosome[geneIndex]!.timeslotId = newSlot;
    }

    attempts++;
    violations = checkSubdivisionClash(chromosome, inputData);
  }

  return chromosome;
}
