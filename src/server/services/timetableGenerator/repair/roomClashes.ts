import { checkRoomClash } from "../constraints";
import { MAX_REPAIR_ATTEMPTS } from "./constants";
import { findValidSlotForGene } from "./helpers";
import type { Chromosome, GAInputData } from "../types";

export function repairRoomClashes(
  chromosome: Chromosome,
  inputData: GAInputData,
): Chromosome {
  let attempts = 0;
  let violations = checkRoomClash(chromosome, inputData);

  while (violations.length > 0 && attempts < MAX_REPAIR_ATTEMPTS) {
    const violation = violations[0]!;

    const geneIndex = violation.geneIndices[0]!;
    const gene = chromosome[geneIndex]!;

    if (gene.isLocked) {
      violations.shift();
      continue;
    }

    // Change slot to avoid classroom conflict
    const newSlot = findValidSlotForGene(gene, chromosome, inputData);
    if (newSlot) {
      chromosome[geneIndex]!.timeslotId = newSlot;
    }

    attempts++;
    violations = checkRoomClash(chromosome, inputData);
  }

  return chromosome;
}
