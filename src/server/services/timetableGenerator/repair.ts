/**
 * Repair Mechanism Module for Timetable Generator
 *
 * This module implements chromosome repair strategies to reduce hard constraint
 * violations after crossover operations.
 *
 * Strategy: Limited-attempt greedy repair
 * - Focus only on hard constraint violations (clashes)
 * - Maximum 10 attempts per violation type
 * - Don't over-repair - partial violations are acceptable
 *
 * Performance target: <20ms per chromosome
 *
 * Research reference: Section 4.3
 */

import type { Chromosome, Gene, GAInputData, GAConfig } from "./types";
import {
  checkTeacherClash,
  checkSubdivisionClash,
  checkRoomClash,
  checkTeacherUnavailability,
  checkSubdivisionUnavailability,
  checkRoomUnavailability,
} from "./constraints";

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_REPAIR_ATTEMPTS = 10;
const MAX_SLOT_SEARCH_ATTEMPTS = 20; // Try up to 20 random slots before giving up

// ============================================================================
// MAIN REPAIR FUNCTION
// ============================================================================

/**
 * Repair a chromosome by attempting to fix hard constraint violations.
 *
 * Strategy:
 * 1. Evaluate chromosome to identify violations
 * 2. Focus ONLY on hard constraint violations
 * 3. For each violation type, attempt limited repairs
 * 4. After MAX_REPAIR_ATTEMPTS, give up (let fitness function penalize)
 *
 * Important: Don't over-repair! Goal is to reduce violations, not achieve perfection.
 *
 * @param chromosome - Chromosome to repair
 * @param inputData - Complete timetable input data
 * @param config - GA configuration
 * @returns Repaired chromosome (may still have some violations)
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

// ============================================================================
// TEACHER CLASH REPAIR
// ============================================================================

/**
 * Repair teacher clash violations by moving conflicting lectures to different slots.
 *
 * Strategy:
 * - For each teacher clash, move one of the conflicting lectures to a different slot
 * - Try random slots until one doesn't create immediate clash
 * - Limited attempts: give up after MAX_REPAIR_ATTEMPTS
 */
function repairTeacherClashes(
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

// ============================================================================
// SUBDIVISION CLASH REPAIR
// ============================================================================

/**
 * Repair subdivision clash violations by moving conflicting lectures.
 */
function repairSubdivisionClashes(
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

// ============================================================================
// ROOM CLASH REPAIR
// ============================================================================

/**
 * Repair room clash violations by changing slot.
 *
 * Strategy:
 * - Change timeslot to avoid classroom conflicts
 * - Classrooms are immutable (defined per lecture), so we can only change timing
 *
 * NOTE: With immutable combined classrooms, room clashes occur when two lectures
 * sharing ANY classroom are scheduled in the same slot.
 */
function repairRoomClashes(
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

// ============================================================================
// AVAILABILITY VIOLATION REPAIR
// ============================================================================

/**
 * Repair availability violations (teacher, subdivision, classroom unavailable).
 */
function repairAvailabilityViolations(
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find a valid slot for a gene that doesn't create immediate clashes.
 *
 * Strategy:
 * - Try random slots until one doesn't create clash
 * - Check: teacher available, subdivision available, not creating new clashes
 * - Limited attempts: MAX_SLOT_SEARCH_ATTEMPTS
 *
 * @returns New slot ID if found, null otherwise
 */
function findValidSlotForGene(
  gene: Gene,
  chromosome: Chromosome,
  inputData: GAInputData,
): string | null {
  const { slots, lookupMaps } = inputData;
  const lecture = lookupMaps.eventToLecture.get(gene.lectureEventId);

  if (!lecture) return null;

  const teacherId = lecture.teacherId;
  const subdivisionIds =
    lookupMaps.eventToSubdivisions.get(gene.lectureEventId) || [];

  for (let attempt = 0; attempt < MAX_SLOT_SEARCH_ATTEMPTS; attempt++) {
    const randomSlotIndex = Math.floor(Math.random() * slots.length);
    const candidateSlot = slots[randomSlotIndex]!;
    const slotId = candidateSlot.id;

    // Check teacher availability
    const teacherUnavailable = lookupMaps.teacherUnavailable.get(teacherId);
    if (teacherUnavailable?.has(slotId)) {
      continue;
    }

    // Check subdivision availability
    let subdivisionUnavailable = false;
    for (const subdivisionId of subdivisionIds) {
      if (lookupMaps.subdivisionUnavailable.get(subdivisionId)?.has(slotId)) {
        subdivisionUnavailable = true;
        break;
      }
    }
    if (subdivisionUnavailable) {
      continue;
    }

    // Check if this would create a clash with existing assignments
    // (simple check: any other gene in this slot with same teacher/subdivision)
    let wouldCreateClash = false;
    for (const otherGene of chromosome) {
      if (otherGene.lectureEventId === gene.lectureEventId) continue;
      if (otherGene.timeslotId !== slotId) continue;

      const otherLecture = lookupMaps.eventToLecture.get(
        otherGene.lectureEventId,
      );
      if (!otherLecture) continue;

      // Teacher clash check
      if (otherLecture.teacherId === teacherId) {
        wouldCreateClash = true;
        break;
      }

      // Subdivision clash check
      const otherSubdivisions =
        lookupMaps.eventToSubdivisions.get(otherGene.lectureEventId) || [];
      const hasCommonSubdivision = subdivisionIds.some((sid) =>
        otherSubdivisions.includes(sid),
      );
      if (hasCommonSubdivision) {
        wouldCreateClash = true;
        break;
      }
    }

    if (!wouldCreateClash) {
      return slotId;
    }
  }

  return null; // No valid slot found
}
