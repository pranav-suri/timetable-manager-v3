/**
 * Population Initialization Module for Timetable Generator
 *
 * This module implements hybrid population initialization strategies:
 * - Random initialization for diversity
 * - Heuristic initialization for better starting solutions
 *
 * Based on Research Section 4.1
 */

import type {
  Chromosome,
  Gene,
  GAInputData,
  GAConfig,
  Population,
  FitnessResult,
} from "./types";
import {
  evaluatePopulation,
  FitnessCache,
  calculatePopulationStats,
  type PopulationFitnessStats,
} from "./fitness";

// ============================================================================
// RANDOM CHROMOSOME INITIALIZATION
// ============================================================================

/**
 * Initialize a single chromosome with random assignments.
 *
 * Strategy:
 * - For each event, randomly select timeslot
 * - Respect locked assignments (pre-assigned slots)
 * - Classrooms are immutable (stored in lecture.combinedClassrooms)
 *
 * @param inputData - Complete timetable input data
 * @returns A randomly initialized chromosome
 */
export function initializeRandomChromosome(inputData: GAInputData): Chromosome {
  const chromosome: Chromosome = [];
  const { eventIds, lookupMaps, slots } = inputData;

  for (let i = 0; i < eventIds.length; i++) {
    const eventId = eventIds[i]!;
    const lecture = lookupMaps.eventToLecture.get(eventId);

    if (!lecture) {
      throw new Error(`Lecture not found for event ${eventId}`);
    }

    // Check if this event has a locked assignment
    const lockedAssignment = lookupMaps.lockedAssignments.get(eventId);

    let timeslotId: string;
    let isLocked = false;

    if (lockedAssignment) {
      // Use locked timeslot
      timeslotId = lockedAssignment.slotId;
      isLocked = true;
    } else {
      // Random timeslot
      timeslotId = selectRandomSlot(slots);
    }

    const gene: Gene = {
      lectureEventId: eventId,
      lectureId: lecture.id,
      timeslotId,
      isLocked,
      duration: lecture.duration,
    };

    chromosome.push(gene);
  }

  return chromosome;
}

/**
 * Select a random slot from available slots.
 */
function selectRandomSlot(slots: GAInputData["slots"]): string {
  const randomIndex = Math.floor(Math.random() * slots.length);
  return slots[randomIndex]!.id;
}

// ============================================================================
// HEURISTIC CHROMOSOME INITIALIZATION
// ============================================================================

/**
 * Initialize a single chromosome using greedy heuristic.
 *
 * Strategy:
 * - Schedule most constrained events first (locked, then by duration)
 * - For each event, select slot that minimizes conflicts
 * - This produces better starting solutions than pure random
 * - Classrooms are immutable (stored in lecture.combinedClassrooms)
 *
 * @param inputData - Complete timetable input data
 * @returns A heuristically initialized chromosome
 */
export function initializeHeuristicChromosome(
  inputData: GAInputData,
): Chromosome {
  const { eventIds, lookupMaps, slots } = inputData;

  // Create event metadata for sorting
  interface EventMeta {
    eventId: string;
    lectureId: string;
    lecture: GAInputData["lectures"][0];
    isLocked: boolean;
  }

  const eventMetas: EventMeta[] = eventIds.map((eventId) => {
    const lecture = lookupMaps.eventToLecture.get(eventId)!;
    const isLocked = lookupMaps.lockedAssignments.has(eventId);

    return {
      eventId,
      lectureId: lecture.id,
      lecture,
      isLocked,
    };
  });

  // Sort by constraints: locked first, then by duration
  eventMetas.sort((a, b) => {
    if (a.isLocked && !b.isLocked) return -1;
    if (!a.isLocked && b.isLocked) return 1;
    return b.lecture.duration - a.lecture.duration;
  });

  // Initialize partial chromosome with same order as eventIds
  const geneMap = new Map<string, Gene>();

  // Schedule events in priority order
  for (const meta of eventMetas) {
    const { eventId, lecture, isLocked } = meta;
    const lockedAssignment = lookupMaps.lockedAssignments.get(eventId);

    let timeslotId: string;

    if (lockedAssignment) {
      // Use locked assignment
      timeslotId = lockedAssignment.slotId;
    } else {
      // Heuristic: find slot with minimal conflicts
      const bestSlot = findBestSlotForEvent(
        eventId,
        lecture,
        Array.from(geneMap.values()),
        slots,
        lookupMaps,
      );
      timeslotId = bestSlot;
    }

    const gene: Gene = {
      lectureEventId: eventId,
      lectureId: lecture.id,
      timeslotId,
      isLocked,
      duration: lecture.duration,
    };

    geneMap.set(eventId, gene);
  }

  // Convert map back to ordered array
  const chromosome: Chromosome = eventIds.map(
    (eventId) => geneMap.get(eventId)!,
  );

  return chromosome;
}

/**
 * Find the best slot for an event by minimizing conflicts with already-scheduled genes.
 */
function findBestSlotForEvent(
  eventId: string,
  lecture: GAInputData["lectures"][0],
  scheduledGenes: Gene[],
  slots: GAInputData["slots"],
  lookupMaps: GAInputData["lookupMaps"],
): string {
  const teacherId = lecture.teacherId;
  const subdivisionIds = lookupMaps.eventToSubdivisions.get(eventId) || [];

  // Count conflicts for each slot
  const slotConflicts = new Map<string, number>();

  for (const slot of slots) {
    let conflicts = 0;

    // Check for conflicts with already-scheduled genes in this slot
    for (const gene of scheduledGenes) {
      if (gene.timeslotId === slot.id) {
        const otherLecture = lookupMaps.eventToLecture.get(gene.lectureEventId);
        if (!otherLecture) continue;

        // Teacher conflict
        if (otherLecture.teacherId === teacherId) {
          conflicts += 10; // High penalty for teacher clash
        }

        // Subdivision conflict
        const otherSubdivisions = lookupMaps.eventToSubdivisions.get(
          gene.lectureEventId,
        );
        if (otherSubdivisions) {
          const hasOverlap = subdivisionIds.some((sid) =>
            otherSubdivisions.includes(sid),
          );
          if (hasOverlap) {
            conflicts += 10; // High penalty for subdivision clash
          }
        }
      }
    }

    slotConflicts.set(slot.id, conflicts);
  }

  // Find slot with minimum conflicts
  let bestSlotId = slots[0]!.id;
  let minConflicts = slotConflicts.get(bestSlotId) || 0;

  for (const slot of slots) {
    const conflicts = slotConflicts.get(slot.id) || 0;
    if (conflicts < minConflicts) {
      minConflicts = conflicts;
      bestSlotId = slot.id;
    }
  }

  return bestSlotId;
}

// ============================================================================
// POPULATION INITIALIZATION
// ============================================================================

/**
 * Initialize a complete population with hybrid strategy.
 *
 * Strategy:
 * - config.heuristicInitRatio of population uses heuristic initialization
 * - Remainder uses random initialization
 * - Shuffle to mix heuristic and random chromosomes
 *
 * @param config - GA configuration
 * @param inputData - Complete timetable input data
 * @returns Initialized population
 */
export function initializePopulation(
  config: GAConfig,
  inputData: GAInputData,
): Population {
  const population: Population = [];

  // Calculate counts
  const heuristicCount = Math.floor(
    config.populationSize * config.heuristicInitRatio,
  );
  const randomCount = config.populationSize - heuristicCount;

  console.log(`Initializing population:`);
  console.log(`  Heuristic chromosomes: ${heuristicCount}`);
  console.log(`  Random chromosomes: ${randomCount}`);
  console.log(`  Total: ${config.populationSize}`);

  // Generate heuristic chromosomes
  for (let i = 0; i < heuristicCount; i++) {
    population.push(initializeHeuristicChromosome(inputData));
  }

  // Generate random chromosomes
  for (let i = 0; i < randomCount; i++) {
    population.push(initializeRandomChromosome(inputData));
  }

  // Shuffle population using Fisher-Yates algorithm
  for (let i = population.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [population[i], population[j]] = [population[j]!, population[i]!];
  }

  // Validate
  if (population.length !== config.populationSize) {
    throw new Error(
      `Population size mismatch: expected ${config.populationSize}, got ${population.length}`,
    );
  }

  for (const chromosome of population) {
    if (chromosome.length !== inputData.totalEvents) {
      throw new Error(
        `Chromosome length mismatch: expected ${inputData.totalEvents}, got ${chromosome.length}`,
      );
    }
  }

  return population;
}

// ============================================================================
// INITIAL POPULATION EVALUATION
// ============================================================================

/**
 * Evaluate the initial population and return fitness results with statistics.
 *
 * @param population - Initialized population
 * @param inputData - Complete timetable input data
 * @param config - GA configuration
 * @returns Fitness results and population statistics
 */
export function evaluateInitialPopulation(
  population: Population,
  inputData: GAInputData,
  config: GAConfig,
): {
  fitnessResults: FitnessResult[];
  stats: PopulationFitnessStats;
} {
  console.log(`\nEvaluating initial population...`);

  const cache = new FitnessCache();
  const startTime = Date.now();

  const fitnessResults = evaluatePopulation(
    population,
    inputData,
    config.constraintWeights,
    cache,
  );

  const evaluationTime = Date.now() - startTime;
  const stats = calculatePopulationStats(fitnessResults);

  console.log(`  Best fitness: ${stats.bestFitness.toFixed(4)}`);
  console.log(`  Average fitness: ${stats.averageFitness.toFixed(4)}`);
  console.log(`  Worst fitness: ${stats.worstFitness.toFixed(4)}`);
  console.log(
    `  Feasible solutions: ${stats.feasibleCount} / ${population.length} (${(stats.feasibleRatio * 100).toFixed(1)}%)`,
  );
  console.log(
    `  Average hard violations: ${stats.averageHardViolations.toFixed(1)}`,
  );
  console.log(
    `  Average soft violations: ${stats.averageSoftViolations.toFixed(1)}`,
  );
  console.log(
    `\nInitialization complete in ${(evaluationTime / 1000).toFixed(1)}s`,
  );

  const cacheStats = cache.getStats();
  if (cacheStats.hits > 0) {
    console.log(
      `  Cache hit rate: ${(cacheStats.hitRate * 100).toFixed(1)}% (${cacheStats.hits} hits, ${cacheStats.misses} misses)`,
    );
  }

  return { fitnessResults, stats };
}
