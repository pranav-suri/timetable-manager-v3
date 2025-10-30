import type { Chromosome, GAInputData } from "../types";
import { MAX_REPAIR_ATTEMPTS } from "./constants";
import { findValidSlotForGene } from "./helpers";
import { checkTeacherClash } from "../constraints";

export function repairTeacherClashes(
  chromosome: Chromosome,
  inputData: GAInputData,
): Chromosome {
  let attempts = 0;
  let violations = checkTeacherClash(chromosome, inputData);

  while (violations.length > 0 && attempts < MAX_REPAIR_ATTEMPTS) {
    const violation = violations[0]!; // Fix first violation

    // Try to move one of the conflicting genes
    const geneIndex = violation.geneIndices[0]!;
    const gene = chromosome[geneIndex]!;

    // Skip locked genes
    if (gene.isLocked) {
      violations.shift(); // Skip this violation
      continue;
    }

    // Try to find a valid slot
    const newSlot = findValidSlotForGene(gene, chromosome, inputData);
    if (newSlot) {
      chromosome[geneIndex]!.timeslotId = newSlot;
    }

    attempts++;
    violations = checkTeacherClash(chromosome, inputData);
  }

  return chromosome;
}
