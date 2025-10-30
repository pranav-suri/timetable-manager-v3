import type { Chromosome, GAInputData, GAConfig } from "../types";
import { repairTeacherClashes } from "./teacherClashes";
import { repairSubdivisionClashes } from "./subdivisionClashes";
import { repairRoomClashes } from "./roomClashes";
import { repairAvailabilityViolations } from "./availability";

export { MAX_REPAIR_ATTEMPTS, MAX_SLOT_SEARCH_ATTEMPTS } from "./constants";
export { findValidSlotForGene } from "./helpers";

/**
 * Repair a chromosome by attempting to fix hard constraint violations.
 * Matches behavior of the original monolithic repair.ts repairChromosome.
 */
export function repairChromosome(
  chromosome: Chromosome,
  inputData: GAInputData,
  _config: GAConfig,
): Chromosome {
  // Deep copy to avoid modifying original
  let repairedChromosome = chromosome.map((gene) => ({ ...gene }));

  // Attempt to repair each hard constraint type
  repairedChromosome = repairTeacherClashes(repairedChromosome, inputData);
  repairedChromosome = repairSubdivisionClashes(repairedChromosome, inputData);
  repairedChromosome = repairRoomClashes(repairedChromosome, inputData);
  repairedChromosome = repairAvailabilityViolations(
    repairedChromosome,
    inputData,
  );

  return repairedChromosome;
}
