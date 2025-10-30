import type { Chromosome, GAInputData } from "../types";
import { MAX_REPAIR_ATTEMPTS } from "./constants";
import { findValidSlotForGene } from "./helpers";
import {
  checkTeacherUnavailability,
  checkSubdivisionUnavailability,
  checkRoomUnavailability,
} from "../constraints";

export function repairAvailabilityViolations(
  chromosome: Chromosome,
  inputData: GAInputData,
): Chromosome {
  let attempts = 0;

  // Check all availability violations
  let teacherAvailViolations = checkTeacherUnavailability(
    chromosome,
    inputData,
  );
  let subdivisionAvailViolations = checkSubdivisionUnavailability(
    chromosome,
    inputData,
  );
  let classroomAvailViolations = checkRoomUnavailability(chromosome, inputData);

  while (
    (teacherAvailViolations.length > 0 ||
      subdivisionAvailViolations.length > 0 ||
      classroomAvailViolations.length > 0) &&
    attempts < MAX_REPAIR_ATTEMPTS
  ) {
    // Repair teacher availability
    if (teacherAvailViolations.length > 0) {
      const violation = teacherAvailViolations[0]!;
      const geneIndex = violation.geneIndices[0]!;
      const gene = chromosome[geneIndex]!;

      if (!gene.isLocked) {
        const newSlot = findValidSlotForGene(gene, chromosome, inputData);
        if (newSlot) {
          chromosome[geneIndex]!.timeslotId = newSlot;
        }
      }
    }

    // Repair subdivision availability
    if (subdivisionAvailViolations.length > 0) {
      const violation = subdivisionAvailViolations[0]!;
      const geneIndex = violation.geneIndices[0]!;
      const gene = chromosome[geneIndex]!;

      if (!gene.isLocked) {
        const newSlot = findValidSlotForGene(gene, chromosome, inputData);
        if (newSlot) {
          chromosome[geneIndex]!.timeslotId = newSlot;
        }
      }
    }

    // Repair classroom availability
    if (classroomAvailViolations.length > 0) {
      const violation = classroomAvailViolations[0]!;
      const geneIndex = violation.geneIndices[0]!;
      const gene = chromosome[geneIndex]!;

      if (!gene.isLocked) {
        // Change slot to avoid classroom unavailability
        // (classrooms are immutable, can't be changed)
        const newSlot = findValidSlotForGene(gene, chromosome, inputData);
        if (newSlot) {
          chromosome[geneIndex]!.timeslotId = newSlot;
        }
      }
    }

    attempts++;

    // Re-check violations
    teacherAvailViolations = checkTeacherUnavailability(chromosome, inputData);
    subdivisionAvailViolations = checkSubdivisionUnavailability(
      chromosome,
      inputData,
    );
    classroomAvailViolations = checkRoomUnavailability(chromosome, inputData);
  }

  return chromosome;
}
