import { checkSubdivisionClash } from "../constraints";
import { buildSlotOccupancyMap } from "../constraints/utils";
import { MAX_REPAIR_ATTEMPTS } from "./constants";
import { findValidSlotForGene } from "./helpers";
import type { Chromosome, GAInputData } from "../types";

export function repairSubdivisionClashes(
  chromosome: Chromosome,
  inputData: GAInputData,
): Chromosome {
  let attempts = 0;
  const slotOccupancyMap = buildSlotOccupancyMap(chromosome, inputData);
  let violations = checkSubdivisionClash(slotOccupancyMap, chromosome, inputData);

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
    const updatedOccupancyMap = buildSlotOccupancyMap(chromosome, inputData);
    violations = checkSubdivisionClash(updatedOccupancyMap, chromosome, inputData);
  }

  return chromosome;
}
